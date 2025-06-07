ALTER TABLE videos
ADD CONSTRAINT videos_youtube_video_id_key UNIQUE (youtube_video_id);