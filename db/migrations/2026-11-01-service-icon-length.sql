-- Service icons are SVG path strings; varchar(500) cut the gear icon off mid-path during the MySQL import.
ALTER TABLE services ALTER COLUMN icon TYPE text;
-- Complete the truncated gear icon ("…a3 3 0 11-" → "…a3 3 0 11-6 0 3 3 0 016 0z").
UPDATE services SET icon = icon || '6 0 3 3 0 016 0z' WHERE icon LIKE '%M15 12a3 3 0 11-';
