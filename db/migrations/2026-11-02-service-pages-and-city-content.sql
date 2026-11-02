-- Dedicated service pages, unique location content, and a real enquiry pipeline.
-- Text is filled by scripts/seed-content.mjs and is editable in the admin afterwards.
ALTER TABLE services ADD COLUMN IF NOT EXISTS slug varchar(120);
ALTER TABLE services ADD COLUMN IF NOT EXISTS tagline varchar(200);
ALTER TABLE services ADD COLUMN IF NOT EXISTS overview text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS includes_json text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS best_for_json text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS timeline varchar(120);
ALTER TABLE services ADD COLUMN IF NOT EXISTS faq_json text;
CREATE UNIQUE INDEX IF NOT EXISTS services_slug_unique ON services (slug);

ALTER TABLE location_cities ADD COLUMN IF NOT EXISTS about text;
ALTER TABLE location_cities ADD COLUMN IF NOT EXISTS sectors_json text;

ALTER TABLE location_services ADD COLUMN IF NOT EXISTS about text;
ALTER TABLE location_services ADD COLUMN IF NOT EXISTS faq_json text;

-- Enquiries: a pipeline instead of just read/unread, with the budget as its own field.
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS budget varchar(40);
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'new';
UPDATE contact_messages SET status = 'contacted' WHERE is_replied = 1 AND status = 'new';
CREATE INDEX IF NOT EXISTS contact_messages_status ON contact_messages (status);
