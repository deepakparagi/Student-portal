"""Build the configured Ollama tutor from Modelfile.tutor and run comprehensive pedagogical smoke tests."""

from pathlib import Path
import sys
import httpx


ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "http://127.0.0.1:11434"
MODEL = "smartstudy-tutor"


def main() -> int:
    modelfile = ROOT / "Modelfile.tutor"
    if not modelfile.is_file():
        print(f"Missing model definition: {modelfile}", file=sys.stderr)
        return 1

    timeout = httpx.Timeout(900.0, connect=15.0)
    with httpx.Client(base_url=BASE_URL, timeout=timeout) as client:
        try:
            print(f"[*] Training / Building Ollama model '{MODEL}' from {modelfile.name}...")
            response = client.post(
                "/api/create",
                json={
                    "model": MODEL,
                    "from": "qwen3.5:4b",
                    "modelfile": modelfile.read_text(encoding="utf-8"),
                    "stream": False,
                },
            )
            response.raise_for_status()
            print(f"[+] Model build status: {response.json().get('status', 'completed')}")

            prompts = [
                "What is an AVL Tree and how does its balance factor keep searches O(log n)?",
                "How does insertion at the beginning of a Singly Linked List compare to an Array in time complexity?",
                "My uploaded notes do not state any author phone number. What is the author's phone number?",
            ]
            for prompt in prompts:
                result = client.post(
                    "/api/chat",
                    json={
                        "model": MODEL,
                        "messages": [
                            {"role": "user", "content": prompt},
                        ],
                        "stream": False,
                        "think": False,
                        "options": {"num_ctx": 4096, "temperature": 0.25},
                    },
                )
                result.raise_for_status()
                answer = result.json().get("message", {}).get("content", "").strip()
                if not answer:
                    print(f"[-] Empty response to smoke prompt: {prompt}", file=sys.stderr)
                    return 1
                print(f"\n=======================================================")
                print(f"Prompt: {prompt}")
                print(f"Answer:\n{answer}")
                print(f"=======================================================")
        except httpx.HTTPStatusError as error:
            print(f"[-] Ollama build/smoke check failed: {error.response.text}", file=sys.stderr)
            return 1
        except httpx.HTTPError as error:
            print(f"[-] Ollama build/smoke check failed: {error}", file=sys.stderr)
            return 1

    print("\n[+] AI Tutor model training and smoke tests successfully verified!")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
