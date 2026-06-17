-- Package-level booking settings
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS auto_accept boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contract_required boolean NOT NULL DEFAULT true;

-- Digital products default to no contract
UPDATE packages SET contract_required = false WHERE product_type = 'digital' AND contract_required = true;
