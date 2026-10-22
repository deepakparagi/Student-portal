"""
Ollama Client for Local LLM Integration
Supports chat completions, embeddings, and health checks.
"""

import os
import json
import httpx
import asyncio
from typing import Optional, List, Dict, Any, AsyncGenerator
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class OllamaConfig:
    base_url: str = "http://127.0.0.1:11434"
    chat_model: str = "smartstudy-tutor"
    embed_model: str = "nomic-embed-text"
    context_size: int = 8192
    timeout: float = 300.0
    connect_timeout: float = 15.0
    keep_alive: str = "24h"
    think: bool = False

    @classmethod
    def from_env(cls) -> "OllamaConfig":
        think_env = os.getenv("OLLAMA_THINK", "false").strip().lower()
        return cls(
            base_url=os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434"),
            chat_model=os.getenv("OLLAMA_CHAT_MODEL", "smartstudy-tutor"),
            embed_model=os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text"),
            context_size=int(os.getenv("OLLAMA_CONTEXT_SIZE", "4096")),
            timeout=float(os.getenv("OLLAMA_TIMEOUT", "300")),
            connect_timeout=float(os.getenv("OLLAMA_CONNECT_TIMEOUT", "15")),
            keep_alive=os.getenv("OLLAMA_KEEP_ALIVE", "24h"),
            think=think_env in ("true", "1", "yes"),
        )


class OllamaError(Exception):
    """Base exception for Ollama errors."""
    pass


class OllamaConnectionError(OllamaError):
    """Raised when Ollama server is unreachable."""
    pass


class OllamaModelNotFoundError(OllamaError):
    """Raised when requested model is not installed."""
    pass


class OllamaTimeoutError(OllamaError):
    """Raised when request times out."""
    pass


class OllamaClient:
    """
    Async client for Ollama HTTP API.
    Provides chat completions, embeddings, and model management.
    """

    def __init__(self, config: Optional[OllamaConfig] = None):
        self.config = config or OllamaConfig.from_env()
        self._client: Optional[httpx.AsyncClient] = None
        self._model_cache: Dict[str, bool] = {}

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client with configured timeouts."""
        current_loop = asyncio.get_running_loop()
        if (
            self._client is None
            or self._client.is_closed
            or getattr(self, "_loop", None) is not current_loop
        ):
            self._loop = current_loop
            timeout = httpx.Timeout(
                connect=self.config.connect_timeout,
                read=self.config.timeout,
                write=self.config.timeout,
                pool=self.config.timeout,
            )
            self._client = httpx.AsyncClient(
                base_url=self.config.base_url,
                timeout=timeout,
                headers={"Content-Type": "application/json"},
            )
        return self._client

    async def close(self):
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    # =========================================================================
    # Health & Model Management
    # =========================================================================

    async def health_check(self) -> Dict[str, Any]:
        """
        Check Ollama server health and model availability.
        Returns dict with server status and model availability.
        """
        client = await self._get_client()
        try:
            # Check server is up
            resp = await client.get("/api/tags")
            resp.raise_for_status()
            data = resp.json()
            models = {m["name"]: m for m in data.get("models", [])}

            # Match model with or without :latest tag
            def model_available(model_name: str) -> bool:
                return (
                    model_name in models
                    or f"{model_name}:latest" in models
                    or any(k.startswith(f"{model_name}:") for k in models)
                )

            chat_available = model_available(self.config.chat_model)
            embed_available = model_available(self.config.embed_model)

            return {
                "server": "healthy",
                "chat_model": {
                    "name": self.config.chat_model,
                    "available": chat_available,
                    "details": models.get(self.config.chat_model, models.get(f"{self.config.chat_model}:latest", {})),
                },
                "embed_model": {
                    "name": self.config.embed_model,
                    "available": embed_available,
                    "details": models.get(self.config.embed_model, models.get(f"{self.config.embed_model}:latest", {})),
                },
                "all_models": list(models.keys()),
            }
        except httpx.ConnectError as e:
            return {
                "server": "unreachable",
                "error": str(e),
                "chat_model": {"name": self.config.chat_model, "available": False},
                "embed_model": {"name": self.config.embed_model, "available": False},
            }
        except httpx.TimeoutException as e:
            return {
                "server": "timeout",
                "error": str(e),
                "chat_model": {"name": self.config.chat_model, "available": False},
                "embed_model": {"name": self.config.embed_model, "available": False},
            }
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "server": "error",
                "error": str(e),
                "chat_model": {"name": self.config.chat_model, "available": False},
                "embed_model": {"name": self.config.embed_model, "available": False},
            }

    async def list_models(self) -> List[Dict[str, Any]]:
        """List all installed models."""
        client = await self._get_client()
        resp = await client.get("/api/tags")
        resp.raise_for_status()
        return resp.json().get("models", [])

    async def verify_model(self, model: str) -> bool:
        """Check if a model is installed (matches with or without tag)."""
        if model in self._model_cache:
            return self._model_cache[model]
        models = await self.list_models()
        # Match exact or with :latest tag
        available = any(
            m["name"] == model or m["name"] == f"{model}:latest" or m["name"].startswith(f"{model}:")
            for m in models
        )
        self._model_cache[model] = available
        return available

    async def pull_model(self, model: str) -> AsyncGenerator[Dict[str, Any], None]:
        """Pull a model from Ollama registry. Yields progress updates."""
        client = await self._get_client()
        async with client.stream(
            "POST",
            "/api/pull",
            json={"name": model, "stream": True},
            timeout=httpx.Timeout(300.0),  # 5 min for model downloads
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if line:
                    yield json.loads(line)
        self._model_cache[model] = True

    # =========================================================================
    # Chat Completions
    # =========================================================================

    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 1200,
        stream: bool = False,
        think: Optional[bool] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Send chat completion request.
        Returns full response with message content.
        """
        client = await self._get_client()
        used_model = model or self.config.chat_model

        # Verify model is available
        if not await self.verify_model(used_model):
            raise OllamaModelNotFoundError(
                f"Model '{used_model}' not found. Available models: {await self.list_models()}"
            )

        payload = {
            "model": used_model,
            "messages": messages,
            "stream": stream,
            "think": self.config.think if think is None else think,
            "keep_alive": self.config.keep_alive,
            "options": {
                "temperature": temperature,
                "num_ctx": self.config.context_size,
                "num_predict": max_tokens,
                "num_gpu": 99,
                **(options or {}),
            },
        }

        try:
            resp = await client.post("/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()
            msg = data.get("message", {})
            content = msg.get("content", "")
            if not content.strip() and msg.get("thinking"):
                import re
                thinking = msg.get("thinking", "").strip()
                clean_think = re.sub(r"^(Thinking Process:.*?\n\n|Looking at the.*?\n\n)", "", thinking, flags=re.DOTALL)
                data["message"]["content"] = clean_think.strip() or thinking
            return data
        except httpx.ConnectError as e:
            raise OllamaConnectionError(f"Cannot connect to Ollama at {self.config.base_url}: {e}")
        except httpx.TimeoutException as e:
            raise OllamaTimeoutError(f"Request timed out after {self.config.timeout}s: {e}")
        except httpx.HTTPStatusError as e:
            raise OllamaError(f"HTTP {e.response.status_code}: {e.response.text}")

    async def chat_stream(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 1200,
        think: Optional[bool] = None,
        options: Optional[Dict[str, Any]] = None,
    ) -> AsyncGenerator[str, None]:
        """Stream chat completion tokens."""
        client = await self._get_client()
        used_model = model or self.config.chat_model

        if not await self.verify_model(used_model):
            raise OllamaModelNotFoundError(f"Model '{used_model}' not found")

        payload = {
            "model": used_model,
            "messages": messages,
            "stream": True,
            "think": self.config.think if think is None else think,
            "keep_alive": self.config.keep_alive,
            "options": {
                "temperature": temperature,
                "num_ctx": self.config.context_size,
                "num_predict": max_tokens,
                "num_gpu": 99,
                **(options or {}),
            },
        }

        try:
            async with client.stream("POST", "/api/chat", json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if line:
                        data = json.loads(line)
                        if "message" in data and "content" in data["message"]:
                            yield data["message"]["content"]
                        if data.get("done", False):
                            break
        except httpx.ConnectError as e:
            raise OllamaConnectionError(f"Cannot connect to Ollama: {e}")
        except httpx.TimeoutException as e:
            raise OllamaTimeoutError(f"Stream timed out: {e}")

    # =========================================================================
    # Embeddings
    # =========================================================================

    async def embed(
        self,
        input: List[str] | str,
        model: Optional[str] = None,
    ) -> List[List[float]]:
        """
        Generate embeddings for input text(s).
        Returns list of embedding vectors.
        """
        client = await self._get_client()
        used_model = model or self.config.embed_model

        if not await self.verify_model(used_model):
            raise OllamaModelNotFoundError(f"Embedding model '{used_model}' not found")

        # Normalize input to list
        if isinstance(input, str):
            input = [input]

        payload = {
            "model": used_model,
            "input": input,
            "keep_alive": self.config.keep_alive,
        }

        try:
            resp = await client.post("/api/embed", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("embeddings", [])
        except httpx.ConnectError as e:
            raise OllamaConnectionError(f"Cannot connect to Ollama: {e}")
        except httpx.TimeoutException as e:
            raise OllamaTimeoutError(f"Embedding request timed out: {e}")
        except httpx.HTTPStatusError as e:
            raise OllamaError(f"HTTP {e.response.status_code}: {e.response.text}")

    async def embed_single(self, text: str, model: Optional[str] = None) -> List[float]:
        """Generate embedding for a single text."""
        embeddings = await self.embed([text], model)
        return embeddings[0] if embeddings else []


# Global client instance (singleton pattern for reuse)
_global_client: Optional[OllamaClient] = None


async def get_ollama_client() -> OllamaClient:
    """Get or create global Ollama client."""
    global _global_client
    if _global_client is None:
        _global_client = OllamaClient()
    return _global_client


async def close_ollama_client():
    """Close global client."""
    global _global_client
    if _global_client:
        await _global_client.close()
        _global_client = None