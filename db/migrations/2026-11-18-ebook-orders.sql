-- Ebook store (store.bravesyntax.com). One row per Razorpay order. A row is created when the buyer opens
-- checkout (status 'created') and marked 'paid' once the payment signature or the webhook is verified; only then
-- does it get a download token, which the thank-you page and the purchase email link to.
CREATE TABLE IF NOT EXISTS ebook_orders (
  id serial PRIMARY KEY,
  ebook_slug varchar(80) NOT NULL,
  razorpay_order_id varchar(40) NOT NULL UNIQUE,
  razorpay_payment_id varchar(40),
  amount integer NOT NULL,                      -- in paise, as sent to Razorpay
  currency varchar(3) NOT NULL DEFAULT 'INR',
  name varchar(150) NOT NULL,
  email varchar(254) NOT NULL,
  phone varchar(40),
  status varchar(20) NOT NULL DEFAULT 'created', -- created | paid
  download_token varchar(64) UNIQUE,
  download_count integer NOT NULL DEFAULT 0,
  email_sent_at timestamp,
  ip_hash varchar(64),                          -- keyed hash, only for rate limiting
  paid_at timestamp,
  created_at timestamp NOT NULL DEFAULT LOCALTIMESTAMP
);
CREATE INDEX IF NOT EXISTS ebook_orders_email_idx ON ebook_orders (email);
CREATE INDEX IF NOT EXISTS ebook_orders_ip_idx ON ebook_orders (ip_hash, created_at);
