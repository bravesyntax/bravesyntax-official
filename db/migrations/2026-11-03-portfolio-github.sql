-- Links a portfolio project to its GitHub repository, for Admin → GitHub Projects.
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS github_repo varchar(120) DEFAULT NULL;
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS github_url varchar(300) DEFAULT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS portfolios_github_repo_key ON portfolios (github_repo) WHERE github_repo IS NOT NULL;
