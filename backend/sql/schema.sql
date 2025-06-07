-- Enable the uuid-ossp extension if not already enabled, for gen_random_uuid()
-- You might need to run this separately if you get an error about the function not existing.
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Table: videos
-- Description: Stores information about YouTube videos that have been analyzed or cached.
-- -----------------------------------------------------------------------------
CREATE TABLE public.videos (
    youtube_video_id TEXT PRIMARY KEY,
    video_title TEXT,
    channel_title TEXT,
    last_cached_comment_retrieval_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.videos IS 'Stores information about YouTube videos that have been analyzed or cached.';
COMMENT ON COLUMN public.videos.youtube_video_id IS 'Unique YouTube video ID (e.g., dQw4w9WgXcQ). Primary Key.';
COMMENT ON COLUMN public.videos.video_title IS 'Title of the YouTube video.';
COMMENT ON COLUMN public.videos.channel_title IS 'Title of the YouTube channel that uploaded the video.';
COMMENT ON COLUMN public.videos.last_cached_comment_retrieval_timestamp IS 'Timestamp of when the latest batch of 100 comments was last retrieved for this video.';
COMMENT ON COLUMN public.videos.created_at IS 'Timestamp of when this video record was first created in our system.';
COMMENT ON COLUMN public.videos.updated_at IS 'Timestamp of when this video record was last updated in our system.';

-- Create an index for faster lookups if needed, though primary key is already indexed.
-- CREATE INDEX IF NOT EXISTS idx_videos_youtube_video_id ON public.videos(youtube_video_id);


-- -----------------------------------------------------------------------------
-- Table: comments
-- Description: Stores individual YouTube comments fetched for caching and analysis.
-- -----------------------------------------------------------------------------
CREATE TABLE public.comments (
    youtube_comment_id TEXT PRIMARY KEY,
    youtube_video_id TEXT NOT NULL REFERENCES public.videos(youtube_video_id) ON DELETE CASCADE,
    text_content TEXT,
    author_name TEXT,
    published_at TIMESTAMPTZ,
    like_count INTEGER DEFAULT 0,
    retrieved_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now() -- When the comment was added to *this* table
);

COMMENT ON TABLE public.comments IS 'Stores individual YouTube comments fetched for caching and analysis.';
COMMENT ON COLUMN public.comments.youtube_comment_id IS 'Unique YouTube comment ID. Primary Key.';
COMMENT ON COLUMN public.comments.youtube_video_id IS 'Foreign key referencing the video this comment belongs to.';
COMMENT ON COLUMN public.comments.text_content IS 'The actual text content of the comment.';
COMMENT ON COLUMN public.comments.author_name IS 'Display name of the comment author.';
COMMENT ON COLUMN public.comments.published_at IS 'Timestamp when the comment was originally published on YouTube.';
COMMENT ON COLUMN public.comments.like_count IS 'Number of likes the comment has received on YouTube.';
COMMENT ON COLUMN public.comments.retrieved_at IS 'Timestamp when this comment was fetched/cached by our system.';
COMMENT ON COLUMN public.comments.created_at IS 'Timestamp of when this comment record was created in our system.';

-- Indexes for foreign key and frequently queried columns
CREATE INDEX IF NOT EXISTS idx_comments_youtube_video_id ON public.comments(youtube_video_id);
CREATE INDEX IF NOT EXISTS idx_comments_published_at ON public.comments(published_at DESC); -- For "comments by date" chart


-- -----------------------------------------------------------------------------
-- Table: analyses
-- Description: Stores records of each sentiment analysis run performed by a user on a video.
-- -----------------------------------------------------------------------------
CREATE TABLE public.analyses (
    analysis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    youtube_video_id TEXT NOT NULL REFERENCES public.videos(youtube_video_id) ON DELETE CASCADE,
    analysis_timestamp TIMESTAMPTZ DEFAULT now(),
    total_comments_analyzed INTEGER,
    -- Optional: Add overall sentiment score if you calculate one
    -- overall_sentiment_score_positive FLOAT,
    -- overall_sentiment_score_neutral FLOAT,
    -- overall_sentiment_score_critical FLOAT,
    -- overall_sentiment_score_toxic FLOAT,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.analyses IS 'Stores records of each sentiment analysis run performed by a user on a video.';
COMMENT ON COLUMN public.analyses.analysis_id IS 'Unique identifier for this analysis run. Primary Key.';
COMMENT ON COLUMN public.analyses.user_id IS 'Foreign key referencing the user who performed this analysis (from auth.users).';
COMMENT ON COLUMN public.analyses.youtube_video_id IS 'Foreign key referencing the video that was analyzed.';
COMMENT ON COLUMN public.analyses.analysis_timestamp IS 'Timestamp when this specific analysis was performed.';
COMMENT ON COLUMN public.analyses.total_comments_analyzed IS 'Number of comments included in this analysis run (e.g., up to 100).';
COMMENT ON COLUMN public.analyses.created_at IS 'Timestamp of when this analysis record was created.';

-- Indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_youtube_video_id ON public.analyses(youtube_video_id);


-- -----------------------------------------------------------------------------
-- Table: analysis_category_summaries
-- Description: Stores the AI-generated summaries and comment counts for each sentiment
--              category within a specific analysis run.
-- -----------------------------------------------------------------------------
CREATE TABLE public.analysis_category_summaries (
    summary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(analysis_id) ON DELETE CASCADE,
    category_name TEXT NOT NULL, -- E.g., 'Positive', 'Neutral', 'Critical', 'Toxic'
    comment_count_in_category INTEGER,
    summary_text TEXT, -- The AI-generated summary
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.analysis_category_summaries IS 'Stores AI-generated summaries and comment counts for each sentiment category within an analysis run.';
COMMENT ON COLUMN public.analysis_category_summaries.summary_id IS 'Unique identifier for this category summary. Primary Key.';
COMMENT ON COLUMN public.analysis_category_summaries.analysis_id IS 'Foreign key referencing the analysis this summary belongs to.';
COMMENT ON COLUMN public.analysis_category_summaries.category_name IS 'The name of the sentiment category (e.g., Positive, Neutral, Critical, Toxic).';
COMMENT ON COLUMN public.analysis_category_summaries.comment_count_in_category IS 'Number of comments classified into this category for this analysis run.';
COMMENT ON COLUMN public.analysis_category_summaries.summary_text IS 'The AI-generated summary for this category for this analysis run.';
COMMENT ON COLUMN public.analysis_category_summaries.created_at IS 'Timestamp of when this summary record was created.';

-- Index for foreign key
CREATE INDEX IF NOT EXISTS idx_analysis_category_summaries_analysis_id ON public.analysis_category_summaries(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_category_summaries_category_name ON public.analysis_category_summaries(category_name);


-- -----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- -----------------------------------------------------------------------------
-- REMINDER: Supabase enables RLS by default on new tables.
-- You will need to define policies for each table to control access.
-- Example for `analyses` (Users can only see their own analyses):
--
-- ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Users can select their own analyses"
--   ON public.analyses FOR SELECT
--   USING (auth.uid() = user_id);
--
-- CREATE POLICY "Users can insert their own analyses"
--   ON public.analyses FOR INSERT
--   WITH CHECK (auth.uid() = user_id);
--
-- Similar policies should be created for `analysis_category_summaries` based on the `analysis_id`
-- which in turn links to `user_id`.
--
-- For `videos` and `comments`, policies might be more permissive for reads if this data is considered
-- shareable or cached publicly, but inserts/updates would likely be restricted to your backend service role.

-- -----------------------------------------------------------------------------
-- Helper functions (Optional: Example for automatically updating `updated_at` columns)
-- -----------------------------------------------------------------------------
-- CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = NOW();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- Apply the trigger to the videos table (and others if they have updated_at)
-- CREATE TRIGGER set_timestamp_videos
-- BEFORE UPDATE ON public.videos
-- FOR EACH ROW
-- EXECUTE FUNCTION public.trigger_set_timestamp();


