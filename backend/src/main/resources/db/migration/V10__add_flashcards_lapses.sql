-- V10: Add lapses column to flashcards table
ALTER TABLE flashcards ADD COLUMN lapses INT NOT NULL DEFAULT 0 AFTER review_count;
