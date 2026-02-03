CREATE TABLE IF NOT EXISTS video_comments (
    id SERIAL PRIMARY KEY,
    video_id VARCHAR NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_email VARCHAR NOT NULL,
    user_type VARCHAR CHECK (user_type IN ('creator', 'editor')),
    comment_text TEXT NOT NULL,
    parent_comment_id INTEGER REFERENCES video_comments(id) ON DELETE CASCADE,
    timestamp_seconds INTEGER, -- For timestamp comments like "At 2:35"
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_video_comments_video_id ON video_comments(video_id);
CREATE INDEX idx_video_comments_parent ON video_comments(parent_comment_id);