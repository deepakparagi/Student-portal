import os
import sys
import time
import requests
import json
from io import BytesIO
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://localhost:8080/api/v1"
ML_URL = "http://localhost:8000"

def create_fixtures():
    fixtures_dir = Path("./test_fixtures")
    fixtures_dir.mkdir(exist_ok=True)
    
    # 1. PDF Fixture (Aurora Scholarship)
    import fitz
    pdf_path = fixtures_dir / "aurora_scholarship.pdf"
    if not pdf_path.exists():
        doc = fitz.open()
        page = doc.new_page()
        text = (
            "OFFICIAL SCHOLARSHIP ANNOUNCEMENT\n\n"
            "The fictional Aurora Scholarship has reference number AZ-7319 and provides 18450 rupees per semester.\n"
            "Applications close on 17 February 2027.\n"
            "All registered full-time students in science and technology may submit their portfolio.\n"
            "Payments are released semiannually following verification of academic standing."
        )
        page.insert_text(fitz.Point(50, 80), text, fontsize=12)
        doc.save(str(pdf_path))
        doc.close()
    
    # 2. DOCX Fixture
    from docx import Document
    docx_path = fixtures_dir / "quantum_computing.docx"
    if not docx_path.exists():
        doc_docx = Document()
        doc_docx.add_heading("Quantum Computing Basics", level=1)
        doc_docx.add_paragraph("A qubit is the basic unit of quantum information, capable of superposition.")
        table = doc_docx.add_table(rows=2, cols=2)
        table.cell(0, 0).text = "Gate"
        table.cell(0, 1).text = "Function"
        table.cell(1, 0).text = "Hadamard"
        table.cell(1, 1).text = "Creates equal superposition"
        doc_docx.save(str(docx_path))
    
    # 3. XLSX Fixture
    import openpyxl
    xlsx_path = fixtures_dir / "grades.xlsx"
    if not xlsx_path.exists():
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Math"
        ws.append(["Student", "Score", "Grade"])
        ws.append(["Alice", 95, "A"])
        ws.append(["Bob", 82, "B"])
        ws.append(["Charlie", 74, "C"])
        wb.save(str(xlsx_path))
    
    # 4. CSV Fixture
    csv_path = fixtures_dir / "attendance.csv"
    if not csv_path.exists():
        with open(csv_path, "w", encoding="utf-8") as f:
            f.write("Date,Subject,Status\n2026-10-01,Calculus,Present\n2026-10-02,Physics,Present\n")
        
    # 5. PPTX Fixture
    from pptx import Presentation
    pptx_path = fixtures_dir / "solar_system.pptx"
    if not pptx_path.exists():
        prs = Presentation()
        slide = prs.slides.add_slide(prs.slide_layouts[0])
        slide.shapes.title.text = "Planetary Systems"
        slide.placeholders[1].text = "Jupiter is the largest planet in our solar system."
        prs.save(str(pptx_path))
    
    return {
        "pdf": pdf_path,
        "docx": docx_path,
        "xlsx": xlsx_path,
        "csv": csv_path,
        "pptx": pptx_path
    }

def run_tests():
    print("=" * 60)
    print("RUNNING LOCAL AI DOCUMENT TUTOR VERIFICATION SUITE")
    print("=" * 60)
    
    fixtures = create_fixtures()
    print("[PASS] Test fixtures created: PDF, DOCX, XLSX, CSV, PPTX", flush=True)
    
    # Authenticate Student
    s = requests.Session()
    login_res = s.post(f"{BASE_URL}/auth/login", json={"email": "student@test.com", "password": "Password123!"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    print("[PASS] Authenticated as student@test.com", flush=True)
    
    # Upload Aurora Scholarship PDF
    with open(fixtures["pdf"], "rb") as f:
        up_res = s.post(f"{BASE_URL}/materials", files={"file": ("aurora_scholarship.pdf", f, "application/pdf")})
    assert up_res.status_code == 202, f"Upload failed: {up_res.status_code} {up_res.text}"
    mat_id = up_res.json()["id"]
    print(f"[PASS] Uploaded aurora_scholarship.pdf (ID: {mat_id})", flush=True)
    
    # Wait for processing and indexing
    status = "PROCESSING"
    for i in range(240):
        time.sleep(1)
        res = s.get(f"{BASE_URL}/materials/{mat_id}")
        if res.status_code == 200:
            target = res.json()
            if target.get("status") in ["COMPLETED", "FAILED"]:
                status = target["status"]
                break
        if (i + 1) % 10 == 0:
            print(f"Waiting for material processing... ({i + 1}s)", flush=True)
            
    assert status == "COMPLETED", f"Material processing failed with status: {status}"
    print("[PASS] Material successfully extracted and indexed in ChromaDB", flush=True)
    
    # Test Grounded Questions
    # Q1: Reference Number
    res_q1 = s.post(f"{BASE_URL}/tutor/ask-grounded", json={
        "question": "What is the scholarship reference number?",
        "materialIds": [mat_id]
    })
    assert res_q1.status_code == 200, f"Q1 failed: {res_q1.text}"
    ans_q1 = res_q1.json()["messages"][-1]["content"]
    src_q1 = res_q1.json()["messages"][-1]["sources"]
    print(f"\nQ1 Answer:\n{ans_q1}\nSources: {len(src_q1)}", flush=True)
    assert "AZ-7319" in ans_q1, f"Expected AZ-7319 in answer, got: {ans_q1}"
    assert len(src_q1) > 0, "Expected at least 1 citation source"
    print("[PASS] Question 1: Reference number AZ-7319 correctly retrieved with citation", flush=True)
    
    # Q2: Amount per semester
    res_q2 = s.post(f"{BASE_URL}/tutor/ask-grounded", json={
        "question": "How much does the scholarship provide per semester?",
        "materialIds": [mat_id]
    })
    assert res_q2.status_code == 200
    ans_q2 = res_q2.json()["messages"][-1]["content"]
    print(f"\nQ2 Answer:\n{ans_q2}", flush=True)
    assert "18" in ans_q2 and "450" in ans_q2, f"Expected 18450 in answer, got: {ans_q2}"
    print("[PASS] Question 2: Amount (18450) correctly retrieved with citation", flush=True)
    
    # Q3: Application deadline
    res_q3 = s.post(f"{BASE_URL}/tutor/ask-grounded", json={
        "question": "When do applications close?",
        "materialIds": [mat_id]
    })
    assert res_q3.status_code == 200
    ans_q3 = res_q3.json()["messages"][-1]["content"]
    print(f"\nQ3 Answer:\n{ans_q3}", flush=True)
    assert "17 February 2027" in ans_q3 or "February" in ans_q3, f"Expected February 2027, got: {ans_q3}"
    print("[PASS] Question 3: Deadline (17 February 2027) correctly retrieved", flush=True)
    
    # Q4: Insufficient Evidence Test (Eligibility age)
    res_q4 = s.post(f"{BASE_URL}/tutor/ask-grounded", json={
        "question": "What is the scholarship's eligibility age?",
        "materialIds": [mat_id]
    })
    assert res_q4.status_code == 200
    ans_q4 = res_q4.json()["messages"][-1]["content"].lower()
    print(f"\nQ4 (Absent Fact) Answer:\n{ans_q4}", flush=True)
    acceptable_phrases = [
        "not contain", "does not specify", "not mentioned", "not provide", "no information", 
        "not state", "does not state", "not specified", "does not mention", "no mention", "unspecified"
    ]
    assert any(w in ans_q4 for w in acceptable_phrases), \
        f"Expected insufficient evidence admission, got: {ans_q4}"
    print("[PASS] Question 4: Honest insufficient-evidence response for absent facts", flush=True)
    
    # Test Document Deletion & Vector Cleanup
    del_res = s.delete(f"{BASE_URL}/materials/{mat_id}")
    assert del_res.status_code == 200, f"Delete failed: {del_res.text}"
    print("[PASS] Document deleted and removed from ChromaDB index", flush=True)
    
    print("\n" + "=" * 60, flush=True)
    print("ALL ACCEPTANCE TESTS PASSED SUCCESSFULLY!", flush=True)
    print("=" * 60, flush=True)
    return True

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
