import unittest
from io import BytesIO
from starlette.datastructures import UploadFile
from fastapi import HTTPException
from app.main import TextInput, extract, health, keywords, topics, summarize
from app.ollama_client import close_ollama_client
from app.vector_store import close_vector_store

class ServiceTests(unittest.TestCase):
    def test_health(self):
        async def health_and_close_clients():
            try:
                return await health()
            finally:
                await close_ollama_client()
                await close_vector_store()

        res = self.run_async(health_and_close_clients())
        status = res.status if hasattr(res, "status") else res["status"]
        self.assertIn(status, ["ok", "healthy"])
    def test_keyword_extraction(self):
        result = self.run_async(keywords(TextInput(text="Photosynthesis converts light energy into chemical energy. Photosynthesis supports plant growth.")))
        self.assertEqual(result["keywords"][0]["keyword"], "photosynthesis")
    def test_topic_extraction_handles_empty_candidate_set(self):
        result = self.run_async(topics(TextInput(text="the and are is for")))
        self.assertEqual(result["topics"], [])
    def test_summary_is_marked_as_draft(self):
        result = self.run_async(summarize(TextInput(text="A cell is the basic unit of life. Cells form tissues in many organisms.")))
        self.assertIn("basic unit", result["summary"])
        self.assertIn("Verify", result["notice"])
    def test_extracts_utf8_text(self):
        result = self.run_async(extract(UploadFile(filename="notes.txt", file=BytesIO(b"A short study note."))))
        text_val = result.text if hasattr(result, "text") else result["text"]
        self.assertEqual(text_val, "A short study note.")
    def test_rejects_unsupported_file(self):
        with self.assertRaises(HTTPException) as caught:
            self.run_async(extract(UploadFile(filename="image.png",file=BytesIO(b"x"))))
        self.assertEqual(caught.exception.status_code,415)
    def test_semantic_search_only_returns_matching_source_text(self):
        from app.main import SearchInput, semantic_search
        result=semantic_search(SearchInput(question="How do plants make sugar?",context="Photosynthesis is the process plants use to convert light into chemical energy. Cell membranes control movement in and out of cells."))
        self.assertEqual(len(result["matches"]),1)
        self.assertIn("Photosynthesis",result["matches"][0]["text"])
    def test_question_and_card_generation_uses_explicit_definitions(self):
        from app.main import flashcards, questions, FlashcardsRequest, QuestionsRequest
        source="Photosynthesis is the process by which plants convert light into chemical energy. Respiration is the process organisms use to release energy from food."
        cards=flashcards(FlashcardsRequest(text=source))["flashcards"]
        quiz=self.run_async(questions(QuestionsRequest(text=source)))["questions"]
        self.assertGreaterEqual(len(cards),2)
        self.assertEqual(len(quiz),2)  # One question per definition pair
        self.assertIn(quiz[0]["correct_answer"], quiz[0]["options"])

    def test_question_generation_by_topic(self):
        from unittest.mock import patch
        from app.main import questions, QuestionsRequest
        with (
            patch("app.main.call_llm", side_effect=RuntimeError("offline test")),
            patch("app.main.fetch_topic_encyclopedia_data", return_value=(None, None)),
            patch("app.main.generate_encyclopedic_quiz", return_value=[]),
        ):
            quiz = self.run_async(questions(QuestionsRequest(topic="Operating Systems", count=3)))["questions"]
        self.assertEqual(len(quiz), 3)
        self.assertTrue("operating system" in quiz[0]["question"].lower())
        self.assertEqual(len(quiz[0]["options"]), 4)
        self.assertEqual(quiz[0]["correct_index"], 0)

    def test_flashcard_generation_by_topic(self):
        from unittest.mock import patch
        from app.main import flashcards, FlashcardsRequest
        with patch("app.main.call_llm", side_effect=RuntimeError("offline test")):
            cards = flashcards(FlashcardsRequest(topic="Database Systems", count=4))["flashcards"]
        self.assertEqual(len(cards), 4)
        self.assertTrue("database system" in cards[0]["front"].lower())

    @staticmethod
    def run_async(awaitable):
        import asyncio
        return asyncio.run(awaitable)

if __name__ == "__main__": unittest.main()
