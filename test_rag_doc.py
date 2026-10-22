import requests
import time

prompt = """<|start_header_id|>system<|end_header_id|>
You are Smart Study AI Tutor. Use the reference material below as primary source when answering the student. Always cite [Source: Operating Systems Notes.pdf, page 5].

--- BEGIN REFERENCE MATERIAL ---
[Source: Operating Systems Notes.pdf, page 5]
Process Scheduling in Operating Systems:
A process goes through multiple states in its lifecycle:
1. New: The process is being created.
2. Ready: The process is waiting to be assigned to a processor.
3. Running: Instructions are being executed.
4. Waiting/Blocked: The process is waiting for some event to occur (e.g. I/O completion).
5. Terminated: The process has finished execution.
The Short-Term Scheduler (CPU scheduler) selects which process in ready state should be executed next.
--- END REFERENCE MATERIAL ---<|eot_id|>
<|start_header_id|>user<|end_header_id|>
analyze the uploaded pdf and start teaching me operating system step by step<|eot_id|>
<|start_header_id|>assistant<|end_header_id|>
"""

t0 = time.time()
resp = requests.post(
    "http://127.0.0.1:11434/api/generate",
    json={"model": "smartstudy-tutor", "prompt": prompt, "stream": False},
    timeout=30
)
print(f"Status: {resp.status_code}, Elapsed: {time.time()-t0:.2f}s")
print("Response:\n", resp.json().get("response"))
