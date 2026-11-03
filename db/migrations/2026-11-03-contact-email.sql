-- Admin sign-in codes, public contact details and blog footers all use the Gmail address.
UPDATE admin_users SET email = 'bravesyntax@gmail.com' WHERE email = 'support@bravesyntax.com';
UPDATE site_settings SET setting_value = 'bravesyntax@gmail.com' WHERE setting_key = 'contact_email';
UPDATE blog_posts SET content = REPLACE(content, 'support@bravesyntax.com', 'bravesyntax@gmail.com') WHERE content LIKE '%support@bravesyntax.com%';
