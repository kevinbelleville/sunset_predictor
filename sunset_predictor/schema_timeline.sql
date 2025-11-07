-- Migration to add unique constraint for timeline support
-- This prevents duplicate predictions for the same location and sunset time

-- Add unique constraint to prevent duplicates
-- (Can be run on existing database - will fail if duplicates exist)
ALTER TABLE predictions
ADD CONSTRAINT unique_prediction
UNIQUE (latitude, longitude, sunset_time);

-- Create index for efficient timeline queries
CREATE INDEX IF NOT EXISTS idx_location_sunset_time
ON predictions(latitude, longitude, sunset_time DESC);

-- Create index for date-based queries
CREATE INDEX IF NOT EXISTS idx_timestamp_desc
ON predictions(timestamp DESC);
