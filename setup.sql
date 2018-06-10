CREATE TABLE IF NOT EXISTS analytics (
        timestamp timestamp DEFAULT CURRENT_TIMESTAMP,
        pathname text NOT NULL,
        meta json
);

CREATE INDEX ON analytics.pathname;

