CREATE TABLE predictions (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    sunset_time TIME NOT NULL,
    cloud_cover DECIMAL(5,2),
    cloud_low DECIMAL(5,2),
    cloud_mid DECIMAL(5,2),
    cloud_high DECIMAL(5,2),
    humidity DECIMAL(5,2),
    visibility DECIMAL(10,2),
    vpd DECIMAL(6,3),
    pm2_5 DECIMAL(6,2),
    pm10 DECIMAL(6,2),
    aod DECIMAL(6,4),
    predicted_score DECIMAL(5,2) NOT NULL,
    actual_quality INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_timestamp ON predictions(timestamp);
