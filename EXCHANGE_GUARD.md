# Supabase 교환 어뷰징 방어 패턴

## 문제
앱인토스 `executePromotion` API는 `{ promotionCode, key, amount }` 구조로 클라이언트가 amount를 직접 전달.
localStorage만 사용하면 DevTools로 값 조작 후 임의 금액 인출 가능.

## executePromotion API 구조 (서버-to-서버)
```
curl https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/promotion/execute-promotion \
  --request POST \
  --header 'Content-Type: application/json' \
  --header 'X-Toss-User-Key: 12345678' \
  --data '{ "promotionCode": "...", "key": "...", "amount": 0 }'
```
- `X-Toss-User-Key` 헤더로 유저 식별
- 관련 API: `getKey` (키 생성), `getExecutionResult` (결과 조회)

## 방어 구현 (spoon-forge-point에서 검증됨)

### 필수 변경: Next.js 정적 → 서버 모드
- `next.config.js`: `output: 'export'` 제거
- `vercel.json`: `outputDirectory` 제거
- `granite.config.ts`: `outdir: '.next'`

### Supabase 설정
- 프로젝트: `zuijoonrqjkvnphuxgou` (bd-yoon's Project, ap-northeast-1)
- 환경변수 (서버 전용, NEXT_PUBLIC_ 붙이지 않음):
  ```
  SUPABASE_URL=https://zuijoonrqjkvnphuxgou.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=<service_role key>
  ```
- `.env.local`에 저장, `.gitignore`에 반드시 추가

### DB 스키마 (exchange_log)
```sql
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
```

### API Route 패턴 (`app/api/exchange/route.js`)
1. amount 범위 검증 (MIN ~ MAX)
2. Supabase에서 user_key + kst_date로 중복 교환 체크
3. 이력 INSERT
4. 성공 응답 (v2에서 executePromotion 실제 호출 추가)

### 클라이언트 변경
- 교환 함수를 async로 변경
- `fetch('/api/exchange', { method: 'POST', body: { userId, amount } })`
- 서버 성공 후에만 로컬 보관함 초기화
- 로딩/에러 상태 UI 추가

### 유저 식별자
- 현재: localStorage UUID 폴백 (`lib/userId.js`)
- TODO: `@apps-in-toss/web-framework`에서 X-Toss-User-Key 획득 방법 확인

## 프로젝트별 적용 현황

| 프로젝트 | 상태 | 비고 |
|---------|------|------|
| spoon-forge-point | 완료 | 금액 상한 5,100원, 일 1회 |
| three-bottle-game | 구현 완료 | 고정 9원, Vercel Serverless `api/exchange.js`, app_id='3bottle' |

## 핵심 파일 (spoon-forge-point, 레퍼런스)
- `lib/supabase.js` — Supabase 서버 클라이언트
- `lib/userId.js` — 유저 식별자 유틸
- `app/api/exchange/route.js` — 교환 API
- `components/CollectionScreen.jsx` — 클라이언트 교환 UI
- `supabase/migrations/20260307000000_exchange_log.sql` — 테이블 생성
