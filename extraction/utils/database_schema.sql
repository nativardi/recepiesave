-- Description: Database schema for Audio Processing Pipeline
-- Creates all required tables for job tracking, audio files, transcriptions, analyses, and embeddings
-- Run this migration using Supabase MCP or Supabase dashboard

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Audio Jobs Table: Tracks the overall processing job
CREATE TABLE IF NOT EXISTS audio_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    platform TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT,
    metadata_json JSONB
);

-- Audio Files Table: Stores information about processed audio files
CREATE TABLE IF NOT EXISTS audio_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES audio_jobs(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    supabase_url TEXT NOT NULL,
    duration FLOAT,
    size_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thumbnails Table: Stores thumbnail images for videos
CREATE TABLE IF NOT EXISTS thumbnails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES audio_jobs(id) ON DELETE CASCADE,
    thumbnail_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transcriptions Table: Stores audio transcriptions
CREATE TABLE IF NOT EXISTS transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audio_file_id UUID NOT NULL REFERENCES audio_files(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    language TEXT,
    timestamps_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analyses Table: Stores AI-generated content analysis
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audio_file_id UUID NOT NULL REFERENCES audio_files(id) ON DELETE CASCADE,
    summary TEXT,
    topics_json JSONB,
    sentiment TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Embeddings Table: Stores vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audio_file_id UUID NOT NULL REFERENCES audio_files(id) ON DELETE CASCADE,
    vector vector(1536), -- text-embedding-3-small produces 1536-dimensional vectors
    metadata_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audio_jobs_status ON audio_jobs(status);
CREATE INDEX IF NOT EXISTS idx_audio_jobs_created_at ON audio_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_audio_files_job_id ON audio_files(job_id);
CREATE INDEX IF NOT EXISTS idx_thumbnails_job_id ON thumbnails(job_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_audio_file_id ON transcriptions(audio_file_id);
CREATE INDEX IF NOT EXISTS idx_analyses_audio_file_id ON analyses(audio_file_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_audio_file_id ON embeddings(audio_file_id);

-- Create vector similarity index for embeddings (using HNSW for fast approximate nearest neighbor search)
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings 
USING hnsw (vector vector_cosine_ops);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on audio_jobs
CREATE TRIGGER update_audio_jobs_updated_at BEFORE UPDATE ON audio_jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

