CREATE TABLE exchange_log (
  id BIGSERIAL PRIMARY KEY,
  user_key TEXT NOT NULL,
  amount INTEGER NOT NULL,
  kst_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exchange_user_date ON exchange_log(user_key, kst_date);

ALTER TABLE exchange_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON exchange_log FOR ALL
  USING (auth.role() = 'service_role');
