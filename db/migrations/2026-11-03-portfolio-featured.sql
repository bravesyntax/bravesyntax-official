-- Marks a project as featured: it comes first on the home page and in the spotlight on Our Work.
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS is_featured smallint NOT NULL DEFAULT 0;
