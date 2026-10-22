"""
ChromaDB Vector Store for Document Chunk Storage and Retrieval
Provides persistent local vector storage with metadata filtering.
"""

import os
import json
import uuid
import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path

import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions

from .ollama_client import OllamaClient, get_ollama_client, OllamaConfig

logger = logging.getLogger(__name__)


@dataclass
class DocumentChunk:
    """Represents a document chunk with metadata for vector storage."""
    id: str
    material_id: int
    chunk_ordinal: int
    text: str
    page_number: Optional[int] = None
    heading: Optional[str] = None
    sheet_name: Optional[str] = None
    row_range: Optional[str] = None
    slide_number: Optional[int] = None
    section: Optional[str] = None
    token_count: int = 0
    file_type: str = "unknown"
    filename: str = ""

    def to_metadata(self) -> Dict[str, Any]:
        """Convert to ChromaDB-compatible metadata (no nested objects)."""
        return {
            "material_id": self.material_id,
            "chunk_ordinal": self.chunk_ordinal,
            "page_number": self.page_number if self.page_number is not None else -1,
            "heading": self.heading or "",
            "sheet_name": self.sheet_name or "",
            "row_range": self.row_range or "",
            "slide_number": self.slide_number if self.slide_number is not None else -1,
            "section": self.section or "",
            "token_count": self.token_count,
            "file_type": self.file_type,
            "filename": self.filename,
        }

    @classmethod
    def from_metadata(cls, metadata: Dict[str, Any], text: str, chunk_id: str) -> "DocumentChunk":
        """Reconstruct chunk from ChromaDB metadata."""
        return cls(
            id=chunk_id,
            material_id=metadata.get("material_id", 0),
            chunk_ordinal=metadata.get("chunk_ordinal", 0),
            text=text,
            page_number=metadata.get("page_number") if metadata.get("page_number", -1) != -1 else None,
            heading=metadata.get("heading") or None,
            sheet_name=metadata.get("sheet_name") or None,
            row_range=metadata.get("row_range") or None,
            slide_number=metadata.get("slide_number") if metadata.get("slide_number", -1) != -1 else None,
            section=metadata.get("section") or None,
            token_count=metadata.get("token_count", 0),
            file_type=metadata.get("file_type", "unknown"),
            filename=metadata.get("filename", ""),
        )

    def citation_string(self) -> str:
        """Generate human-readable citation string."""
        parts = [self.filename]
        if self.file_type == "pdf" and self.page_number is not None:
            parts.append(f"page {self.page_number}")
        elif self.file_type in ("xlsx", "xlsm", "csv") and self.sheet_name:
            if self.row_range:
                parts.append(f"sheet {self.sheet_name}, rows {self.row_range}")
            else:
                parts.append(f"sheet {self.sheet_name}")
        elif self.file_type in ("pptx", "ppt") and self.slide_number is not None:
            parts.append(f"slide {self.slide_number}")
        elif self.heading:
            parts.append(f"section '{self.heading}'")
        return f"[{', '.join(parts)}]"


class ChromaVectorStore:
    """
    Persistent local vector store using ChromaDB.
    Stores document chunks with embeddings for semantic search.
    """

    def __init__(
        self,
        persist_dir: str = "./chroma_data",
        collection_name: str = "smart_study_documents",
        ollama_client: Optional[OllamaClient] = None,
    ):
        self.persist_dir = Path(persist_dir).resolve()
        self.collection_name = collection_name
        self.ollama_client = ollama_client
        self._client: Optional[chromadb.PersistentClient] = None
        self._collection = None

    def _get_client(self) -> chromadb.PersistentClient:
        """Get or create ChromaDB persistent client."""
        if self._client is None:
            self.persist_dir.mkdir(parents=True, exist_ok=True)
            self._client = chromadb.PersistentClient(
                path=str(self.persist_dir),
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True,
                ),
            )
        return self._client

    def _get_collection(self):
        """Get or create the document collection."""
        if self._collection is None:
            client = self._get_client()
            self._collection = client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"},
            )
        return self._collection

    async def initialize(self):
        """Initialize the vector store and verify Ollama connection."""
        self._get_collection()
        if self.ollama_client:
            health = await self.ollama_client.health_check()
            if health.get("server") != "healthy":
                logger.warning(f"Ollama health check: {health}")
            elif not health.get("embed_model", {}).get("available", False):
                logger.warning(f"Embedding model {self.ollama_client.config.embed_model} not available")

    def _generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using Ollama (sync wrapper for ChromaDB)."""
        # Note: ChromaDB embedding functions expect sync, but we use async Ollama
        # We'll handle this by generating embeddings externally and passing them
        raise NotImplementedError("Use add_chunks_with_embeddings instead")

    async def add_chunks(self, chunks: List[DocumentChunk]) -> int:
        """
        Add document chunks with embeddings to the vector store.
        Returns number of chunks added.
        """
        if not chunks:
            return 0

        collection = self._get_collection()

        # Generate embeddings
        texts = [chunk.text for chunk in chunks]
        embeddings = await self._get_embeddings(texts)

        # Prepare data for ChromaDB
        ids = [chunk.id for chunk in chunks]
        metadatas = [chunk.to_metadata() for chunk in chunks]
        documents = texts

        # Add to collection (upsert to handle duplicates)
        collection.upsert(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents,
        )

        logger.info(f"Added {len(chunks)} chunks to vector store for material {chunks[0].material_id}")
        return len(chunks)

    async def _get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings from Ollama."""
        if self.ollama_client:
            return await self.ollama_client.embed(texts)
        else:
            # Fallback: create dummy embeddings (should not happen in production)
            logger.warning("No Ollama client available for embeddings")
            return [[0.0] * 768 for _ in texts]

    async def search(
        self,
        query_text: str,
        material_ids: Optional[List[int]] = None,
        file_types: Optional[List[str]] = None,
        k: int = 5,
        min_score: float = -1.0,
    ) -> List[Tuple[DocumentChunk, float]]:
        """
        Search for relevant chunks using semantic similarity.
        Returns list of (chunk, score) tuples.
        """
        collection = self._get_collection()

        # Build where filter
        conditions = []
        if material_ids:
            clean_ids = [int(m) for m in material_ids]
            if len(clean_ids) == 1:
                conditions.append({"material_id": clean_ids[0]})
            else:
                conditions.append({"material_id": {"$in": clean_ids}})
        if file_types:
            if len(file_types) == 1:
                conditions.append({"file_type": file_types[0]})
            else:
                conditions.append({"file_type": {"$in": file_types}})

        where = None
        if len(conditions) == 1:
            where = conditions[0]
        elif len(conditions) > 1:
            where = {"$and": conditions}

        # Generate query embedding
        query_embedding = None
        if self.ollama_client:
            try:
                query_embedding = await self.ollama_client.embed_single(query_text)
            except Exception as e:
                logger.warning(f"Error obtaining query embedding from Ollama: {e}")

        results = None
        try:
            if query_embedding:
                results = collection.query(
                    query_embeddings=[query_embedding],
                    n_results=k,
                    where=where if where else None,
                    include=["documents", "metadatas", "distances"],
                )
            else:
                results = collection.query(
                    query_texts=[query_text],
                    n_results=k,
                    where=where if where else None,
                    include=["documents", "metadatas", "distances"],
                )
        except Exception as e:
            logger.warning(f"ChromaDB query with filter failed, retrying without filter: {e}")
            try:
                if query_embedding:
                    results = collection.query(
                        query_embeddings=[query_embedding],
                        n_results=k,
                        include=["documents", "metadatas", "distances"],
                    )
                else:
                    results = collection.query(
                        query_texts=[query_text],
                        n_results=k,
                        include=["documents", "metadatas", "distances"],
                    )
            except Exception as ex:
                logger.error(f"ChromaDB query completely failed: {ex}")
                return []

        # Convert results to DocumentChunk objects with scores
        chunks_with_scores = []
        if results["ids"] and results["ids"][0]:
            for i, chunk_id in enumerate(results["ids"][0]):
                distance = results["distances"][0][i]
                # Convert cosine distance to similarity score (1 - distance)
                score = 1.0 - distance

                if score < min_score:
                    continue

                metadata = results["metadatas"][0][i]
                text = results["documents"][0][i]
                chunk = DocumentChunk.from_metadata(metadata, text, chunk_id)
                chunks_with_scores.append((chunk, score))

        return chunks_with_scores

    async def search_by_material(
        self,
        query_text: str,
        material_id: int,
        k: int = 5,
    ) -> List[Tuple[DocumentChunk, float]]:
        """Search within a specific material."""
        return await self.search(query_text, material_ids=[material_id], k=k)

    def get_material_chunks(self, material_id: int) -> List[DocumentChunk]:
        """Get all chunks for a specific material."""
        collection = self._get_collection()
        results = collection.get(
            where={"material_id": material_id},
            include=["documents", "metadatas"],
        )

        chunks = []
        if results["ids"]:
            for i, chunk_id in enumerate(results["ids"]):
                metadata = results["metadatas"][i]
                text = results["documents"][i]
                chunk = DocumentChunk.from_metadata(metadata, text, chunk_id)
                chunks.append(chunk)

        # Sort by chunk_ordinal
        chunks.sort(key=lambda c: c.chunk_ordinal)
        return chunks

    def delete_material(self, material_id: int) -> int:
        """Delete all chunks for a material. Returns count deleted."""
        collection = self._get_collection()
        results = collection.get(where={"material_id": material_id}, include=[])
        if results["ids"]:
            collection.delete(ids=results["ids"])
            logger.info(f"Deleted {len(results['ids'])} chunks for material {material_id}")
            return len(results["ids"])
        return 0

    def get_stats(self) -> Dict[str, Any]:
        """Get vector store statistics."""
        collection = self._get_collection()
        count = collection.count()
        return {
            "total_chunks": count,
            "collection_name": self.collection_name,
            "persist_dir": str(self.persist_dir),
        }

    def reset(self):
        """Reset the collection (delete all data)."""
        client = self._get_client()
        try:
            client.delete_collection(self.collection_name)
        except Exception:
            pass
        self._collection = None
        self._get_collection()  # Recreate empty collection


# Global vector store instance
_global_vector_store: Optional[ChromaVectorStore] = None


async def get_vector_store() -> ChromaVectorStore:
    """Get or create global vector store."""
    global _global_vector_store
    if _global_vector_store is None:
        persist_dir = os.getenv("CHROMA_PERSIST_DIR", "./chroma_data")
        ollama = await get_ollama_client()
        _global_vector_store = ChromaVectorStore(
            persist_dir=persist_dir,
            ollama_client=ollama,
        )
        await _global_vector_store.initialize()
    return _global_vector_store


async def close_vector_store():
    """Close global vector store."""
    global _global_vector_store
    _global_vector_store = None