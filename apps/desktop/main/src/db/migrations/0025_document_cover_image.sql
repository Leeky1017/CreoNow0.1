-- Migration 0025: Add cover_image_url column to documents table
ALTER TABLE documents ADD COLUMN cover_image_url TEXT;
