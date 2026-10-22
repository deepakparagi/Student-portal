import requests
import time

print("Testing Ollama API...")
t0 = time.time()
try:
    resp = requests.post(
        "http://127.0.0.1:11434/api/generate",
        json={"model": "smartstudy-tutor", "prompt": "Hi, who are you in 1 sentence?", "stream": False},
        timeout=30
    )
    print(f"Status: {resp.status_code}, Elapsed: {time.time()-t0:.2f}s")
    print("Response:", resp.json().get("response"))
except Exception as e:
    print(f"Failed after {time.time()-t0:.2f}s: {e}")
