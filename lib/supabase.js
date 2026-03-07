import { createClient } from '@supabase/supabase-js'

// 서버 사이드 전용 (API Route에서만 import)
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
