-- V11: Change password_reset_token_hash from VARBINARY(32) to VARCHAR(64) to match User entity
ALTER TABLE users MODIFY COLUMN password_reset_token_hash VARCHAR(64) NULL;
