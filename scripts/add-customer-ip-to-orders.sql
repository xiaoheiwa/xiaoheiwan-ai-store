-- Hotfix for the GLOBAL order insert path.
-- Safe additive change: no existing order data is modified.

ALTER TABLE orders ADD COLUMN customer_ip TEXT;
