import requests
import time

print("Testing smartstudy-tutor...")
t0 = time.time()
try:
    resp = requests.post(
        "http://127.0.0.1:11434/api/generate",
        json={"model": "smartstudy-tutor", "prompt": "Who is Donald Trump? Answer in 2 sentences.", "stream": False},
        timeout=30
    )
    print(f"Status: {resp.status_code}, Elapsed: {time.time()-t0:.2f}s")
    print("Response:\n", resp.json().get("response"))
except Exception as e:
    print(f"Failed after {time.time()-t0:.2f}s: {e}")
