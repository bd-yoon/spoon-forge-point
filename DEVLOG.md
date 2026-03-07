# 숟가락 대장간 — DEVLOG

## 프로젝트 개요
- **앱ID**: `spoon-forge` / **브랜드**: `bd-yoon`
- **플랫폼**: 앱인토스 Non-Game WebView
- **스택**: Next.js 14 + Tailwind CSS + framer-motion + `output: 'export'`
- **배포**: Vercel 자동배포 (Framework Preset: **Other** — 필수)
- **GitHub**: `bd-yoon/spoon-forge-point`

---

## 게임 스펙 (확정)

### 수저 티어 테이블
| 종류 | 가치 | 확률 | 필요 탭수 |
|------|------|------|-----------|
| 다이아 수저 | 1,000원 | 0.001% | 10,000번 |
| 금수저 | 10원 | 10% | 100번 |
| 은수저 | 5원 | 20% | 50번 |
| 동수저 | 3원 | 30% | 30번 |
| 돌수저 | 1원 | 40% | 10번 |

### 일일 제한
- 무료 기회: 2회/일 (KST 자정 리셋)
- 광고 추가: 최대 3회 (하루 최대 5회)

### 광고 수익화 (3 placements)
- AD-1: 광고 시청 → 기회 1회 추가
- AD-2: 광고 시청 → 해머 강화 (탭수 절반, 당일 유지)
- AD-3: 광고 시청 → 다이아 확률 ×10 부스터 (1시간)

### 포인트 교환
- 최소 10원 이상 누적 시 교환 가능
- 하루 1회 교환 제한
- 보관함 데이터는 **영구 누적** (`spoon_count_[tierId]` — 일일 리셋 없음)
- v1은 UI 플레이스홀더 (실제 토스포인트 API 연동 미완)

---

## 파일 구조

```
spoon-forge-point/
├── app/
│   ├── layout.js          # metadata, viewport (분리 export)
│   ├── globals.css
│   └── page.js            # SCREEN 상태 머신 {MAIN, REVEAL, COLLECTION}
├── components/
│   ├── MainScreen.jsx     # 메인 화면 (탭핑 로직 포함)
│   ├── TappingScreen.jsx  # 미사용 (인라인으로 흡수됨, 파일 보존)
│   ├── SpoonRevealScreen.jsx
│   └── CollectionScreen.jsx
├── lib/
│   ├── adsInToss.js       # AdMob 래퍼 (실환경/mock 자동 분기)
│   ├── gameState.js       # 일일 상태 (KST 자정 리셋)
│   ├── spoonLogic.js      # SPOON_TIERS, rollSpoon(), getTapCount(), formatProb()
│   └── collectionState.js # 누적 수저 보관함 (영구)
├── public/spoons/         # PNG 수저 5종 (spoon-diamond/gold/silver/bronze/stone.png) ← 고퀄 일러스트
├── asset/                 # 크롭 원본 PNG (수저에셋.jpeg에서 추출한 소스)
├── granite.config.ts      # type: 'partner', permissions: ['admob']
├── next.config.js         # output: 'export', trailingSlash: true
├── tools/crop-spoons.html # 브라우저 기반 수저 크롭/배경제거 도구
└── vercel.json            # framework 키 없음 (필수)
```

---

## 핵심 아키텍처 결정

### 1. Pre-roll 방식
attempt 시작 시점에 `rollSpoon(diamondBoosted)`로 수저 종류 사전 추첨.
탭핑 완료 후 결과를 보여주는 것이 아니라, 시작할 때 이미 결정됨.

### 2. 인라인 탭핑 (TAPPING 화면 제거)
초기엔 별도 TappingScreen이 있었으나 funnel drop 문제로 MainScreen에 흡수.
현재 흐름:
```
홈화면 바위 탭 → 즉시 세션 시작 → 탭 누적 → 완료 → SpoonRevealScreen
```
- 기회 있을 때: 바위만 탭하면 됨 (CTA 버튼 없음)
- 기회 소진 시: 하단 CTA "광고 보고 1회 추가" 또는 "내일 다시 오세요 🌙"

### 3. 바위 hit-test
`rockRef.current.getBoundingClientRect()` + 24px padding으로 바위 영역 외 탭 무시.
세션 시작 전/탭핑 중 모두 적용.

### 4. KST 일일 리셋
```javascript
const getKSTDateStr = () =>
  new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
```
리셋 대상 키: `spoon_attemptsUsed`, `spoon_adAttemptsUsed`, `spoon_hammerActive`,
`spoon_exchangedToday`, `spoon_todayValue`

### 5. localStorage SSR-safe
```javascript
const ls = () => typeof window !== 'undefined' ? window.localStorage : null
```

---

## 화면별 주요 컴포넌트

### MainScreen.jsx
- 바위 idle bounce 애니메이션 (framer-motion)
- 바위 생각 말풍선: 3~6초 랜덤 간격, 1.7초 표시, 탭핑 중 숨김
  ```
  ROCK_THOUGHTS = ['나는 커서 무엇이 될까... 🤔', '금수저가 되고 싶다... ✨', ...]
  ```
- 균열 SVG 오버레이 4단계 (crackStage 0~3)
- Canvas 파티클 (RAF 루프, gravity 적용)
- 부스터 버튼: ADS 배지 + 망치 강화(속도×2) / 다이아수저 확률×10
- 탭핑 중: 진행 바 + 탭 카운터, 부스터/카드 opacity-40

### SpoonRevealScreen.jsx
- Spring 애니메이션으로 수저 PNG 등장
- Canvas 컨페티 (티어 색상 기반)
- 포인트 카운트업 애니메이션

### CollectionScreen.jsx
- 수저 5종 그리드 (PNG 이미지 + 보유 개수 + 확률 표기)
- 확률 법적 고지: "수저 등급별 출현 확률은 위와 같습니다. 독립시행입니다."
- 토스포인트 교환 Bottom Sheet 모달

---

## Vercel 배포 주의사항

- Framework Preset 반드시 **Other** 로 설정 (Next.js로 두면 routes-manifest 에러)
- `vercel.json`에 `"framework"` 키 절대 금지
- `next.config.js`의 `output: 'export'` 필수
- **같은 레포에 Vercel 프로젝트 2개 연결 금지** — 하나는 반드시 삭제. 현재 활성 프로젝트: `spoon-forge-point-rxpx`

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "out",
  "installCommand": "npm install"
}
```

---

## granite.config.ts

```typescript
export default defineConfig({
  appName: 'spoon-forge',
  brand: { displayName: '숟가락 대장간', primaryColor: '#0064FF', icon: '' },
  web: { host: 'localhost', port: 3000, commands: { dev: 'next dev', build: 'next build' } },
  outdir: 'out',
  webViewProps: { type: 'partner', bounces: false, pullToRefreshEnabled: false },
  permissions: ['admob'],
})
```

---

## 커밋 히스토리 요약

| 커밋 | 내용 |
|------|------|
| `e05da9a` | 초기 구현 (Next.js 스캐폴딩 + 전체 화면 구현) |
| `f12f784` | 수저 SVG 에셋 5종, 확률 표기, CTA 텍스트, 안내문 가시성, 햅틱 강화 |
| `7442c54` | TappingScreen → MainScreen 인라인 탭핑 흡수, TAPPING 화면 제거 |
| `afd00ff` | 바위 hit-test, 부스터 버튼 ADS 배지/레이블, 연속방문일 제거 |
| `6a8b4b7` | hit-test 탭핑 중에도 적용 (!isTapping 조건 제거) |
| `5218361` | 바위 idle 생각 말풍선 (ROCK_THOUGHTS 10종) |
| `8b800a6` | 말풍선 표시 시간 1.2s → 1.7s |
| `d44a092` | 말풍선 주기 6~12s → 3~6s |
| `f21c004` | 안내 텍스트 pill 제거, "두들겨서 수저 만들기", 다이아 버튼 레이블 |
| `01798e9` | 바위 크기 160→200px, 위치 위로 |
| `7b0610a` | 레이아웃 균형 조정 (justify-center + pb-8) |
| `200f4a3` | DEVLOG.md 최초 작성 |
| `7adbecd` | 수저 에셋 SVG → PNG 교체 (고퀄 일러스트), tools/crop-spoons.html 추가 |
| `b167759` | Toast 위치 버그 수정 (우측 화면 밖 삐져나감 → left-4 right-4 고정) |

---

## 다음 작업 후보 (미완)
- [ ] 실제 토스포인트 API 연동 (Vercel Serverless + Upstash Redis)
- [ ] granite:build → .ait 패키징 → 앱인토스 샌드박스 제출
- [ ] AdMob 테스트 ID → 프로덕션 ID 교체 (제출 직전)
- [ ] 앱스토어 에셋 생성 (로고 600×600, 썸네일, 프리뷰 4장)

---

## 디자인 개선 결정사항 (2026-03-07)

> `DESIGN.md` 신규 작성 완료. 아래는 핵심 결정 이유 기록.

### 개선 방향 원칙
- 광고 배치/수익화 구조 변경 없음 (3 placements 유지)
- 성취감 이펙트 강화 + 획득 순간의 연출에 집중

### P1-A: 수저 공개 등급별 파티클 차별화
- **결정**: `TIER_PARTICLE_CONFIG` 객체로 티어별 파티클 수/색상 분기
- **이유**: 현재 모든 등급이 동일한 60개 파티클 → 다이아/금수저도 시각적으로 특별하지 않음
- **구현 키포인트**: `RevealScreen.jsx` 기존 컨페티 로직에 `tier` 파라미터 분기 추가

### P1-B: 다이아/금수저 풀스크린 연출
- **결정**: 배경 색상 전환 + 글로우 원 확산 + 등급별 별도 사운드/파티클
- **이유**: 0.001% 확률 아이템이 일반 수저와 동일한 연출 → 희귀도 가치 훼손
- **구현 키포인트**: framer-motion `backgroundColor` animate + `useEffect` tier 분기

### P2: 균열 shake 이펙트
- **결정**: 균열 3단계 각각에 진폭이 다른 x 이동 애니메이션 추가
- **이유**: 탭핑의 물리적 타격감 부재 — 균열이 생겨도 화면 반응이 없어 단조로움

### P3: 교환 완료 성공 이펙트
- **결정**: 체크마크 pop + 포인트 카운트다운 + 2s fade-out
- **이유**: 교환 후 아무 피드백 없어 교환이 성공했는지 불명확

---

## 디자인 개선 구현 완료 (2026-03-07)

**커밋**: `8bf54d6` — "feat: 디자인 개선 P1~P3 — 수저 공개 연출 강화 및 이펙트 추가"

**수정 파일**
- `components/SpoonRevealScreen.jsx` — P1-A 등급별 파티클, P1-B 다이아/금수저 풀스크린 연출
- `components/MainScreen.jsx` — P2 균열 단계별 shake 이펙트
- `components/CollectionScreen.jsx` — P3 교환 완료 성공 이펙트

### P1-A 구현: 수저 공개 등급별 파티클
- `SpoonRevealScreen.jsx`: `TIER_PARTICLE_CONFIG` 객체로 티어별 분기
  - stone: 20개 회색, bronze: 30개 청동, silver: 40개 은색, gold: 50개 금색, diamond: 60개 하늘색
- Canvas 파티클 시스템: `MainScreen.jsx` 패턴 재활용 (gravity, velocity, life decay)

### P1-B 구현: 다이아/금수저 풀스크린 연출
- `SpoonRevealScreen.jsx`: `tier === 'diamond'` / `tier === 'gold'` 분기
- 다이아: 배경 → `#1A2A4A`, 수저 0→1.3→1.0 scale + 360° 회전, 글로우 원 확산, 방사형 별 파티클
- 금수저: 배경 → `#2A1A00`, scale 0→1.2→1.0 spring, 황금 글로우 원, 낙하 컨페티
- `framer-motion` `backgroundColor` animate + `useEffect` 분기 처리

### P2 구현: 균열 단계별 shake 이펙트
- `MainScreen.jsx`: `crackStage` 변경 감지 → `useEffect`로 `rockControls.start()` 호출
- Stage 1: `x:[-2,2,-2,0]` 0.15s, Stage 2: `x:[-4,4,-4,4,0]` 0.20s + scale, Stage 3: `x:[-6,6,-6,6,-6,0]` 0.30s + scale

### P3 구현: 교환 완료 성공 이펙트
- `CollectionScreen.jsx`: `exchangeSuccess` state + `successDisplayAmt` 카운트다운 state 추가
- 체크마크 circle: `scale [0,1.2,1]` spring, `#0064FF` 배경
- 포인트 카운트다운: `setInterval` 16ms 단계로 감소, 600ms 완료
- `AnimatePresence` + `fixed inset-0` 오버레이, `pointer-events-none`으로 UI 차단 없음
- 2초 후 자동 fade-out
