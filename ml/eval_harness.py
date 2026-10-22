"""
Smart Study Portal - Local AI Benchmark and Evaluation Harness
Tests Model Quality, Latency, Retrieval Accuracy, Summarization, and Error Classification.
"""

import sys
import time
import json
import requests
from typing import Dict, Any, List

BACKEND_BASE = "http://localhost:8080/api/v1"
ML_BASE = "http://localhost:8000"
OLLAMA_BASE = "http://localhost:11434"
ML_INTERNAL_TOKEN = "dev-internal-token-change-me"

AURORA_DOC_TEXT = (
    "The Aurora Scholarship reference number is AZ-7319. "
    "The award is ₹18,450 per semester. "
    "The application deadline is 17 February 2027. "
    "Recipients must maintain full-time enrollment in an accredited STEM degree program."
)

COMPREHENSIVE_DOC_TEXT = (
    "SECTION 1: INTRODUCTION TO CELLULAR RESPIRATION\n"
    "Cellular respiration is the biochemical pathway by which living cells break down glucose "
    "to yield ATP (adenosine triphosphate). The overall chemical equation is: "
    "C6H12O6 + 6 O2 -> 6 CO2 + 6 H2O + approximately 30-32 ATP molecules.\n\n"
    "SECTION 2: GLYCOLYSIS\n"
    "Glycolysis occurs exclusively in the cytoplasm and requires no oxygen (anaerobic). "
    "One 6-carbon glucose molecule is cleaved into two 3-carbon pyruvate molecules. "
    "It produces a net yield of 2 ATP (via substrate-level phosphorylation) and 2 NADH.\n\n"
    "SECTION 3: CITRIC ACID CYCLE (KREBS CYCLE)\n"
    "Pyruvate enters the mitochondrial matrix and is converted to Acetyl-CoA. "
    "The Krebs cycle processes each Acetyl-CoA, releasing 2 CO2 molecules and producing "
    "3 NADH, 1 FADH2, and 1 GTP/ATP per turn (doubled per original glucose molecule).\n\n"
    "SECTION 4: OXIDATIVE PHOSPHORYLATION\n"
    "Occurring across the inner mitochondrial membrane, the electron transport chain (ETC) "
    "transfers electrons from NADH and FADH2 to oxygen (the terminal electron acceptor), "
    "pumping protons into the intermembrane space. ATP synthase harnesses the resulting "
    "proton motive force to generate the majority of cellular ATP."
)

class BenchmarkRunner:
    def __init__(self, model_name: str = "smartstudy-tutor"):
        self.model_name = model_name
        self.results: Dict[str, Any] = {}
        self.headers = {"X-Internal-Token": ML_INTERNAL_TOKEN, "Content-Type": "application/json"}

    def run_all(self) -> Dict[str, Any]:
        print(f"\n=======================================================")
        print(f"  RUNNING BENCHMARK HARNESS FOR MODEL: {self.model_name}")
        print(f"=======================================================\n")

        # Check health
        health = self.check_health()
        print(f"[*] ML Engine Health: {health.get('status')} | Vector Chunks: {health.get('vector_store', {}).get('total_chunks', 0)}")

        # A. General Conversation
        self.test_general_conversation()

        # B. Exact Fact Retrieval
        self.test_exact_fact_retrieval()

        # C. Missing Information
        self.test_missing_information()

        # D. Follow-up Context
        self.test_followup_context()

        # E. Summarization
        self.test_summarization()

        # F. Retrieval Failure
        self.test_retrieval_failure()

        # G. Persistence Verification
        self.test_persistence()

        # H. Error Classification
        self.test_error_classification()

        return self.results

    def check_health(self) -> Dict[str, Any]:
        resp = requests.get(f"{ML_BASE}/ml/v1/health", timeout=10)
        return resp.json()

    def test_general_conversation(self):
        print("\n--- Test A: General Conversation ---")
        cases = [
            ("hi", "Short conversational greeting"),
            ("hello", "Standard greeting"),
            ("What can you help me with?", "Capability query"),
            ("Explain how gradient descent optimizes neural network weights in 2 sentences.", "Technical concept"),
        ]
        test_results = []
        for prompt, label in cases:
            t0 = time.time()
            try:
                resp = requests.post(
                    f"{ML_BASE}/ml/v1/rag-query",
                    headers=self.headers,
                    json={
                        "question": prompt,
                        "model": self.model_name,
                        "temperature": 0.3,
                    },
                    timeout=60,
                )
                latency = round(time.time() - t0, 2)
                if resp.status_code == 200:
                    ans = resp.json().get("answer", "")
                    passed = len(ans.strip()) > 5 and "error" not in ans.lower()[:30]
                    test_results.append({
                        "prompt": prompt,
                        "label": label,
                        "status": "PASS" if passed else "FAIL",
                        "latency_sec": latency,
                        "answer_preview": ans[:120] + "..." if len(ans) > 120 else ans,
                    })
                    print(f"  [{'PASS' if passed else 'FAIL'}] '{prompt}' -> {latency}s: {ans[:80]}...")
                else:
                    test_results.append({
                        "prompt": prompt,
                        "label": label,
                        "status": "FAIL",
                        "error": f"HTTP {resp.status_code}: {resp.text[:100]}",
                    })
                    print(f"  [FAIL] '{prompt}' -> HTTP {resp.status_code}")
            except Exception as e:
                test_results.append({"prompt": prompt, "label": label, "status": "ERROR", "error": str(e)})
                print(f"  [ERROR] '{prompt}' -> {e}")

        self.results["general_conversation"] = test_results

    def test_exact_fact_retrieval(self):
        print("\n--- Test B: Exact Fact Retrieval (Aurora Scholarship) ---")
        facts = [
            ("What is the reference number?", ["AZ-7319", "az-7319"]),
            ("How much is the award per semester?", ["18,450", "18450"]),
            ("What is the application deadline?", ["17 February 2027", "February 17, 2027", "17 Feb 2027", "2027"]),
        ]
        test_results = []
        for q, expected_keywords in facts:
            t0 = time.time()
            try:
                resp = requests.post(
                    f"{ML_BASE}/ml/v1/rag-query",
                    headers=self.headers,
                    json={
                        "question": q,
                        "document_text": AURORA_DOC_TEXT,
                        "material_title": "Aurora Scholarship Notice",
                        "model": self.model_name,
                        "temperature": 0.2,
                    },
                    timeout=60,
                )
                latency = round(time.time() - t0, 2)
                ans = resp.json().get("answer", "")
                passed = any(kw.lower() in ans.lower() for kw in expected_keywords)
                test_results.append({
                    "question": q,
                    "expected": expected_keywords,
                    "passed": passed,
                    "latency_sec": latency,
                    "answer": ans,
                })
                print(f"  [{'PASS' if passed else 'FAIL'}] '{q}' -> {latency}s: {ans[:90]}...")
            except Exception as e:
                test_results.append({"question": q, "passed": False, "error": str(e)})
                print(f"  [ERROR] '{q}' -> {e}")

        self.results["exact_fact_retrieval"] = test_results

    def test_missing_information(self):
        print("\n--- Test C: Missing Information (Refusal to Hallucinate) ---")
        q = "What age must an applicant be to receive the Aurora Scholarship?"
        t0 = time.time()
        try:
            resp = requests.post(
                f"{ML_BASE}/ml/v1/rag-query",
                headers=self.headers,
                json={
                    "question": q,
                    "document_text": AURORA_DOC_TEXT,
                    "material_title": "Aurora Scholarship Notice",
                    "model": self.model_name,
                    "temperature": 0.2,
                },
                timeout=60,
            )
            latency = round(time.time() - t0, 2)
            ans = resp.json().get("answer", "")
            # Valid refusal terms: "not specify", "does not mention", "no age requirement", "not stated"
            refusal_terms = ["not specify", "does not specify", "not mention", "does not mention", "not stated", "no age", "not provided"]
            proper_refusal = any(term in ans.lower() for term in refusal_terms)
            print(f"  [{'PASS' if proper_refusal else 'FAIL'}] '{q}' -> {latency}s: {ans[:100]}...")
            self.results["missing_information"] = {
                "question": q,
                "passed": proper_refusal,
                "latency_sec": latency,
                "answer": ans,
            }
        except Exception as e:
            self.results["missing_information"] = {"passed": False, "error": str(e)}

    def test_followup_context(self):
        print("\n--- Test D: Follow-up Context Resolution ---")
        t0 = time.time()
        history = [
            {"role": "user", "content": "Tell me about the Aurora Scholarship."},
            {"role": "assistant", "content": "The Aurora Scholarship (Ref AZ-7319) provides ₹18,450 per semester for full-time STEM students."},
        ]
        q = "When does it close?"
        try:
            resp = requests.post(
                f"{ML_BASE}/ml/v1/rag-query",
                headers=self.headers,
                json={
                    "question": q,
                    "conversation_history": history,
                    "document_text": AURORA_DOC_TEXT,
                    "material_title": "Aurora Scholarship Notice",
                    "model": self.model_name,
                    "temperature": 0.2,
                },
                timeout=60,
            )
            latency = round(time.time() - t0, 2)
            ans = resp.json().get("answer", "")
            resolved_deadline = ("17 february" in ans.lower() or "february 17" in ans.lower() or "2027" in ans)
            print(f"  [{'PASS' if resolved_deadline else 'FAIL'}] '{q}' (after context) -> {latency}s: {ans[:100]}...")
            self.results["followup_context"] = {
                "question": q,
                "passed": resolved_deadline,
                "latency_sec": latency,
                "answer": ans,
            }
        except Exception as e:
            self.results["followup_context"] = {"passed": False, "error": str(e)}

    def test_summarization(self):
        print("\n--- Test E: Full Document Summarization ---")
        t0 = time.time()
        try:
            resp = requests.post(
                f"{ML_BASE}/ml/v1/rag-query",
                headers=self.headers,
                json={
                    "question": "Provide a comprehensive, structured summary of this cellular respiration document.",
                    "document_text": COMPREHENSIVE_DOC_TEXT,
                    "material_title": "Cellular Respiration Study Guide",
                    "model": self.model_name,
                    "temperature": 0.3,
                },
                timeout=90,
            )
            latency = round(time.time() - t0, 2)
            ans = resp.json().get("answer", "")
            # Check if all 4 sections are covered
            sections = ["glycolysis", "krebs", "citric", "oxidative", "electron transport", "atp"]
            covered = sum(1 for s in sections if s in ans.lower())
            passed = covered >= 3 and len(ans.strip()) > 200
            print(f"  [{'PASS' if passed else 'FAIL'}] Comprehensive summary ({len(ans)} chars, {covered}/6 key concepts covered) -> {latency}s")
            self.results["summarization"] = {
                "passed": passed,
                "latency_sec": latency,
                "char_length": len(ans),
                "key_concepts_covered": covered,
                "summary_preview": ans[:300] + "...",
            }
        except Exception as e:
            self.results["summarization"] = {"passed": False, "error": str(e)}

    def test_retrieval_failure(self):
        print("\n--- Test F: Retrieval Failure (Absent Topic) ---")
        q = "What is the GPA prerequisite for the NASA astronaut aerospace internship?"
        t0 = time.time()
        try:
            resp = requests.post(
                f"{ML_BASE}/ml/v1/rag-query",
                headers=self.headers,
                json={
                    "question": q,
                    "document_text": AURORA_DOC_TEXT,
                    "material_title": "Aurora Scholarship Notice",
                    "model": self.model_name,
                    "temperature": 0.2,
                },
                timeout=60,
            )
            latency = round(time.time() - t0, 2)
            ans = resp.json().get("answer", "")
            # Must not invent a fake GPA requirement
            no_fake_facts = "gpa" not in ans.lower() or "not mention" in ans.lower() or "no mention" in ans.lower() or "does not contain" in ans.lower()
            print(f"  [{'PASS' if no_fake_facts else 'FAIL'}] '{q}' -> {latency}s: {ans[:100]}...")
            self.results["retrieval_failure"] = {
                "question": q,
                "passed": no_fake_facts,
                "latency_sec": latency,
                "answer": ans,
            }
        except Exception as e:
            self.results["retrieval_failure"] = {"passed": False, "error": str(e)}

    def test_persistence(self):
        print("\n--- Test G: Vector Store Persistence ---")
        try:
            resp = requests.get(f"{ML_BASE}/ml/v1/health", timeout=10)
            data = resp.json()
            total_chunks = data.get("vector_store", {}).get("total_chunks", 0)
            persist_dir = data.get("vector_store", {}).get("persist_dir", "")
            passed = total_chunks > 0 and len(persist_dir) > 0
            print(f"  [{'PASS' if passed else 'FAIL'}] ChromaDB total chunks: {total_chunks} at {persist_dir}")
            self.results["persistence"] = {
                "passed": passed,
                "total_chunks": total_chunks,
                "persist_dir": persist_dir,
            }
        except Exception as e:
            self.results["persistence"] = {"passed": False, "error": str(e)}

    def test_error_classification(self):
        print("\n--- Test H: Error Classification & Validation ---")
        results = []

        # 1. Two-character message "hi" should succeed (HTTP 200, NOT HTTP 422)
        try:
            r1 = requests.post(
                f"{ML_BASE}/ml/v1/semantic-search",
                headers=self.headers,
                json={"question": "hi", "context": "This is a test document context."},
                timeout=10,
            )
            passed = r1.status_code == 200
            print(f"  [{'PASS' if passed else 'FAIL'}] Semantic search 'hi': HTTP {r1.status_code}")
            results.append({"case": "two_char_message_allowed", "status_code": r1.status_code, "passed": passed})
        except Exception as e:
            results.append({"case": "two_char_message_allowed", "passed": False, "error": str(e)})

        # 2. Empty question should return HTTP 422
        try:
            r2 = requests.post(
                f"{ML_BASE}/ml/v1/semantic-search",
                headers=self.headers,
                json={"question": "", "context": "Valid context"},
                timeout=10,
            )
            passed = r2.status_code == 422
            print(f"  [{'PASS' if passed else 'FAIL'}] Empty question rejected with 422: HTTP {r2.status_code}")
            results.append({"case": "empty_question_422", "status_code": r2.status_code, "passed": passed})
        except Exception as e:
            results.append({"case": "empty_question_422", "passed": False, "error": str(e)})

        # 3. Non-existent model should return clear model error (not crash 500)
        try:
            r3 = requests.post(
                f"{ML_BASE}/ml/v1/rag-query",
                headers=self.headers,
                json={"question": "hello", "model": "non-existent-fantasy-model-xyz"},
                timeout=10,
            )
            ans = r3.json().get("answer", "")
            passed = r3.status_code in [200, 400] and ("not found" in ans.lower() or "missing" in r3.json().get("status", ""))
            print(f"  [{'PASS' if passed else 'FAIL'}] Unknown model handled gracefully: {ans[:70]}")
            results.append({"case": "unknown_model_handled", "passed": passed, "answer": ans[:80]})
        except Exception as e:
            results.append({"case": "unknown_model_handled", "passed": False, "error": str(e)})

        self.results["error_classification"] = results

if __name__ == "__main__":
    model = sys.argv[1] if len(sys.argv) > 1 else "smartstudy-tutor"
    runner = BenchmarkRunner(model_name=model)
    res = runner.run_all()
    with open(f"benchmark_{model.replace(':', '_')}.json", "w") as f:
        json.dump(res, f, indent=2)
    print(f"\n[✓] Results saved to benchmark_{model.replace(':', '_')}.json")
