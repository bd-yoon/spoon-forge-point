# 숟가락 대장간 — Design Spec

> **TDS 미사용**: `@toss/tds-mobile` import 금지 (Vercel 빌드 실패). 모든 UI는 Tailwind CSS + framer-motion으로 구현.
> **참조**: 레퍼런스 이미지 `toss_service_1.png` (캐릭터 중심 레이아웃), `toss_service_2.png` (저금통 포인트 패턴)

---

## 화면 상태 머신

```
MAIN ──[바위 두드리기]──► TAPPING ──[탭 완료]──► REVEAL
 ▲                                                  │
 └──────────────[계속/완료]─────────────────────────┘
 │
 └──[보관함 버튼]──► COLLECTION ──[뒤로]──► MAIN
```

- **MAIN**: 기본 허브. 남은 기회 표시, 광고 오퍼, 보관함 진입
- **TAPPING**: 탭 집중 모드. 진행 바, 균열 애니메이션, 파티클
- **REVEAL**: 수저 등장 연출. 스프링 애니메이션, 다음 행동 CTA
- **COLLECTION**: 보관함 + 포인트 교환 (하단 시트)

---

## 색상 팔레트

```css
/* 배경 */
--bg-gradient: linear-gradient(180deg, #C5E8F8 0%, #E8F4FF 55%, #F0F8FF 100%);

/* Primary */
--blue-primary: #0064FF;     /* Toss Blue — CTA, 강조 */
--blue-light: #EBF3FF;       /* 버튼 배경 보조, 배지 */

/* Surface */
--surface-white: #FFFFFF;
--surface-border: #E8EDF2;
--surface-muted: #F7F8FA;

/* Text */
--text-primary: #191F28;
--text-secondary: #6B7684;
--text-disabled: #B0B8C1;

/* 수저 티어 색상 */
--diamond: #5BCEFA;   /* 하늘 반짝임 */
--gold: #F5A623;      /* 황금 */
--silver: #A0A8B0;    /* 은빛 */
--bronze: #CD7F32;    /* 동빛 */
--stone: #6B7280;     /* 돌회색 */

/* 티어 배경 글로우 (reveal 연출용) */
--diamond-glow: rgba(91, 206, 250, 0.3);
--gold-glow: rgba(245, 166, 35, 0.3);
--silver-glow: rgba(160, 168, 176, 0.3);
--bronze-glow: rgba(205, 127, 50, 0.3);
--stone-glow: rgba(107, 114, 128, 0.2);
```

---

## 타이포그래피

- **폰트**: Pretendard (CDN)
  ```html
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
  ```
- **앱 타이틀**: 18px / 700 / `--text-primary`
- **수저 등급 (Reveal)**: 36px / 800 / 티어 색상
- **포인트 가치**: 28px / 700 / `--text-primary`
- **섹션 제목**: 16px / 600 / `--text-primary`
- **본문**: 15px / 400 / `--text-primary`
- **보조 텍스트**: 13px / 400 / `--text-secondary`
- **탭 카운터**: 20px / 700 / `--text-primary` (모노스페이스 숫자 느낌)

---

## 비주얼 에셋 스펙

### 바위 (Rock) — 4단계
구현 방식: **큰 이모지 + CSS filter + 텍스트** 조합으로 구현 (별도 이미지 불필요)

```
rock-stage-0: 🪨  (균열 없음, filter: none)
rock-stage-1: 균열선 1개 overlay (CSS pseudo-element, 33% 투명도 회색 선)
rock-stage-2: 균열선 3개 overlay (더 두꺼워짐)
rock-stage-3: 흔들리는 파편 애니메이션 시작 (shatter)
```

- 표시 크기: 200px × 200px (모바일 기준)
- 이모지 폰트 크기: 160px (텍스트로 렌더링)
- 바위 아래 그림자: `box-shadow: 0 20px 40px rgba(0,0,0,0.12)`
- 균열 오버레이: Canvas 레이어 (절대 포지셔닝, 바위 위에)

### 수저 이모지 — 5종
별도 SVG 불필요. 이모지 조합으로 표현:
```
💎 + 🥄 = 다이아 수저   (색상: #5BCEFA)
🥇 + 🥄 = 금수저       (색상: #F5A623)
🥈 + 🥄 = 은수저       (색상: #A0A8B0)
🥉 + 🥄 = 동수저       (색상: #CD7F32)
🪨 + 🥄 = 돌수저       (색상: #6B7280)
```

보관함 표시용 아이콘: 40px × 40px 원형 배경 + 이모지 24px
Reveal 화면 대형 표시: 80px 이모지

---

## 화면별 설계

### 1. MAIN (메인 허브)

**목적**: 바위 두드리기 진입, 오늘 현황 요약, 광고 오퍼

**레이아웃 (세로 스크롤 없음, 전체 화면)**:
```
┌─────────────────────────────────┐
│  < (없음)    숟가락 대장간  🔥3일 │  ← 헤더 (48px)
│                                 │
│       오늘 남은 기회: 2회          │  ← 서브헤더 pill (#EBF3FF 배경)
│                                 │
│              🪨                 │  ← 바위 중앙 (200px, 살짝 hover bounce)
│         (바위 이미지)             │
│                                 │
│   [ 🔨 해머 강화 ]  [ 💎 부스터 ] │  ← 광고 오퍼 소형 버튼 2개 (row)
│                                 │
│ ┌─────────────────────────────┐ │
│ │  오늘 획득한 수저              │ │  ← 하단 카드 (흰색, rounded-2xl)
│ │  🪨×2  🥉×1                 │ │
│ │  합계 5원      보관함 →       │ │
│ └─────────────────────────────┘ │
│                                 │
│  [      바위 두드리기      ]     │  ← Primary CTA (고정 하단, #0064FF)
└─────────────────────────────────┘
```

**상태별 변화**:
- `attemptsLeft > 0`: CTA 활성 (파란 버튼)
- `attemptsLeft === 0 && adAttemptsLeft > 0`: CTA → "광고 보고 1회 추가" (보조 스타일)
- `attemptsLeft === 0 && adAttemptsLeft === 0`: CTA → "내일 다시 오세요 🌙" (비활성)
- 해머 강화 활성 시: 🔨 버튼에 초록 체크 + "강화 중" 텍스트
- 다이아 부스터 활성 시: 💎 버튼에 타이머 카운트다운 (1시간)

**애니메이션**:
- 바위: 2초 주기 살짝 hover (scale 1.0 → 1.03 → 1.0, ease-in-out)
- 진입: `initial: {opacity:0, y:20}` → `animate: {opacity:1, y:0}` (0.4s easeOut)
- 스트릭 배지: 첫 진입 시 scale 0 → 1.2 → 1.0 (bounce)

**광고 트리거**:
- AD-1: "기회 추가" 버튼 (attemptsLeft=0일 때 CTA로 승격)
- AD-2: "해머 강화" 소형 버튼 (상시 노출, 미사용 시에만 클릭 가능)
- AD-3: "다이아 부스터" 소형 버튼 (상시 노출, 미사용 시에만 클릭 가능)

---

### 2. TAPPING (두드리기)

**목적**: 탭 인터랙션 몰입. 진행감 + 타격 피드백

**레이아웃**:
```
┌─────────────────────────────────┐
│  ✕                   47 / 100   │  ← 닫기 버튼 + 탭 카운터
│  ████████████░░░░░░░░░░░░░░░░░  │  ← 진행 바 (파란색, 상단 고정)
│                                 │
│                                 │
│              🪨                 │  ← 바위 (탭할 때 bounce)
│         (균열 진행 중)           │
│                                 │
│                                 │
│   탭해서 바위를 쪼개세요!          │  ← 안내 텍스트 (하단)
└─────────────────────────────────┘
```

**균열 진행 시각화**:
- 0~33%: 바위 원본 (rock-stage-0)
- 33~66%: 균열 1단계 (Canvas 오버레이: 대각선 균열 1-2개)
- 66~100%: 균열 2단계 (Canvas 오버레이: 균열 3-4개, 더 두꺼움)
- 100% 달성: 바위 사라짐 → shatter 애니메이션 → REVEAL 전환

**탭 애니메이션** (framer-motion):
```javascript
// 탭 시 bounce
controls.start({
  scale: [1, 0.92, 1.04, 1],
  transition: { duration: 0.18, ease: 'easeOut' }
})
// 화면 전체 탭 영역 (바위만이 아닌 전체 화면)
```

**Canvas 파티클 (탭 위치에서 발생)**:
- 파티클 수: 탭당 6-8개
- 색상: `#8B95A1` (회색 돌가루)
- 크기: 2-4px 원형
- 속도: 탭 위치 기준 방사형 퍼짐, 중력(y+) 적용
- 수명: 0.3-0.5초 fade out

**진행 바**:
- 색상: `#0064FF` fill, `#E8EDF2` track
- 높이: 6px, rounded-full
- 탭당 즉시 업데이트 (transition 없음 — 즉각 피드백)

**햅틱**: `navigator.vibrate?.(6)` 탭당 호출

**닫기(✕) 동작**: MAIN으로 복귀, 해당 attempt 소모 (이미 시작했으므로)

---

### 3. REVEAL (수저 등장)

**목적**: 보상 연출. 설렘 → 만족 → 다음 행동 유도

**레이아웃**:
```
┌─────────────────────────────────┐
│                                 │
│         ✨ 금수저 획득! ✨         │  ← 등급명 (36px / 700 / gold색)
│                                 │
│          🥇🥄                   │  ← 수저 아이콘 (80px, 글로우 효과)
│      (glow ring 애니메이션)       │
│                                 │
│           + 10원                │  ← 포인트 가치 (28px / 700)
│      오늘 3번째 수저              │  ← 카운트 (13px / secondary)
│                                 │
│ ─────────────────────────────── │
│  누적 보관함: 금수저 2개, 돌수저 3개 │  ← 간략 요약
│                                 │
│  [  계속하기  ]  [  보관함 보기  ] │  ← CTA (기회 있으면 계속, 없으면 하나만)
└─────────────────────────────────┘
```

**등장 애니메이션 시퀀스**:
```javascript
// 1. 배경 글로우 fade in (0~0.3s)
// 2. 수저 아이콘 아래에서 위로 spring (0.2~0.6s)
//    initial: { y: 60, scale: 0.3, opacity: 0 }
//    animate: { y: 0, scale: 1, opacity: 1 }
//    transition: { type: 'spring', stiffness: 300, damping: 18 }
// 3. 등급명 fade+scale (0.4~0.7s)
// 4. 포인트 가치 카운트업 애니메이션 (0.6~1.0s)
// 5. 컨페티 burst (0.5s 시작, 1.5s 지속)
```

**컨페티**: minhwa-coloring `CompleteScreen.jsx`의 confetti 패턴 재사용
- 색상: 수저 티어별 파레트 적용 (금수저 → 금/노랑 계열 컨페티)

**배경 글로우**: 수저 뒤에 `radial-gradient` 원형 빛 (티어 글로우 색상)

**CTA 조건**:
- `attemptsLeft > 0`: "계속하기" (primary) + "보관함 보기" (secondary)
- `attemptsLeft === 0`: "보관함 보기" (primary, full-width)

---

### 4. COLLECTION (보관함)

**목적**: 누적 수저 확인 + 포인트 교환

**레이아웃**:
```
┌─────────────────────────────────┐
│  <     나의 수저 보관함             │  ← 헤더 (뒤로가기)
│                                 │
│ ┌─────────────────────────────┐ │
│ │  💰 총 34원 모였어요          │ │  ← 가치 카드 (파란 배경)
│ │  오늘 교환 가능              │ │
│ └─────────────────────────────┘ │
│                                 │
│  수저 목록                        │
│ ┌───────┐┌───────┐┌───────┐    │
│ │  💎   ││  🥇   ││  🥈   │    │  ← 티어 카드 (3열 그리드)
│ │  0개  ││  2개  ││  1개  │    │
│ │다이아  ││  금   ││  은   │    │
│ └───────┘└───────┘└───────┘    │
│ ┌───────┐┌───────┐             │
│ │  🥉   ││  🪨   │             │
│ │  3개  ││  5개  │             │
│ │  동   ││  돌   │             │
│ └───────┘└───────┘             │
│                                 │
│  [   토스포인트로 교환하기   ]     │  ← CTA (10원 미만 시 비활성)
│  (오늘 교환 완료 시: "내일 교환 가능")│
└─────────────────────────────────┘
```

**교환 버튼 상태**:
- 활성 (total ≥ 10원 && !exchangedToday): `#0064FF` + 클릭 → 교환 확인 모달
- 비활성 (<10원): `#B0B8C1` + "10원 이상 모아야 교환할 수 있어요"
- 오늘 교환 완료: `#B0B8C1` + "오늘 교환 완료 ✓ 내일 다시 교환할 수 있어요"

**교환 확인 모달** (Dialog):
```
┌─────────────────────────────────┐
│  토스포인트로 교환하기?            │
│  34원 → 토스포인트 34포인트       │
│  [취소]              [교환하기]   │
└─────────────────────────────────┘
```
→ 교환 후: 성공 토스트 + 보관함 차감 처리

**진입 애니메이션**: 오른쪽에서 슬라이드인 (x: 100% → 0%)

---

### 5. AD_OFFER_SHEET (광고 오퍼 시트)

**목적**: 광고 3종 선택 진입점

> AD-1은 MAIN 화면 CTA로 직접 노출. AD-2/3는 메인의 소형 버튼에서 개별 진입. 별도 바텀시트 없이 개별 버튼 클릭 → 즉시 광고 호출.

**광고 버튼 스타일** (각 버튼 독립):
```
┌──────────────────────────────────┐
│  🔨  해머 강화                    │  ← AD-2 버튼
│  탭수 절반! 오늘 하루 적용           │
│  [ 광고 보기 ]  or  [ 강화 중 ✓ ] │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│  💎  다이아 확률 ×10 부스터         │  ← AD-3 버튼
│  남은 시간: 47:23                 │
│  [ 광고 보기 ]  or  [ 부스터 중 ✓ ]│
└──────────────────────────────────┘
```

**광고 로딩 상태**:
- 버튼 클릭 → `loading` spinner 표시 (버튼 내부 교체)
- 광고 완료 → 즉시 보상 적용 + 성공 토스트
- 광고 실패/스킵 → "광고를 끝까지 시청해야 보상을 받을 수 있어요" 토스트

---

## 애니메이션 레퍼런스

```javascript
// 화면 전환 (AnimatePresence)
const screenVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.2 } }
}

// 바위 hover (MAIN 화면 idle)
const rockIdle = {
  animate: { y: [0, -6, 0] },
  transition: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' }
}

// 탭 bounce (TAPPING)
const tapBounce = {
  scale: [1, 0.92, 1.06, 1],
  transition: { duration: 0.18 }
}

// 수저 등장 spring (REVEAL)
const spoonReveal = {
  initial: { y: 80, scale: 0.2, opacity: 0 },
  animate: { y: 0, scale: 1, opacity: 1 },
  transition: { type: 'spring', stiffness: 280, damping: 20, delay: 0.15 }
}

// 컨페티 (REVEAL) — minhwa CompleteScreen.jsx 패턴 재사용
// 보관함 진입 (COLLECTION)
const slideIn = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit:    { x: '100%', opacity: 0, transition: { duration: 0.2 } }
}
```

---

## 반응형 / 안전 영역

```css
/* 전체 컨테이너 */
.app-container {
  width: 100vw;
  min-height: 100vh;
  min-height: 100dvh;  /* dynamic viewport height */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--bg-gradient);
  font-family: 'Pretendard', -apple-system, sans-serif;
}

/* 하단 고정 CTA */
.cta-fixed {
  position: fixed;
  bottom: 0;
  left: 0; right: 0;
  padding: 12px 20px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background: linear-gradient(to top, rgba(240,248,255,1) 70%, transparent);
}
```

- 세로 고정 레이아웃 (스크롤 없음, COLLECTION 제외)
- 최소 터치 타겟: **48px × 48px** (바위 제외 모든 버튼)
- 바위 탭 영역: 화면 전체 (`pointer-events: all`)

---

## 앱스토어 에셋 계획

| 에셋 | 크기 | 콘셉트 |
|------|------|--------|
| 로고 (라이트) | 600×600 | 흰 배경 + 🪨🥄 이모지 + "대장간" 텍스트 |
| 로고 (다크) | 600×600 | 다크 배경 + 동일 |
| 썸네일 | 1000×1000 | 라이트 블루 배경 + 바위 + 금수저 등장 연출 |
| 썸네일 와이드 | 1932×828 | 5종 수저 나열 + "돌을 쪼개 수저를 만들어보세요" |
| 프리뷰 1 | 636×1048 | 메인 화면 (바위 + "오늘 남은 기회 2회") |
| 프리뷰 2 | 636×1048 | 탭 화면 (균열 진행 중, 파티클 이펙트) |
| 프리뷰 3 | 636×1048 | 금수저 획득 연출 화면 |
| 프리뷰 4 | 636×1048 | 보관함 화면 (수저 모음 + 교환 버튼) |

에셋 생성 도구: `tools/generate-assets.html` (브라우저 Canvas 기반, 기존 프로젝트 패턴 참조)

---

## Frontend 핸드오프 체크리스트

- [ ] 배경: `linear-gradient(180deg, #C5E8F8 0%, #E8F4FF 55%, #F0F8FF 100%)`
- [ ] 폰트: Pretendard CDN `layout.js` `<head>`에 추가
- [ ] 수저 이모지: 이미지 파일 불필요, 텍스트+이모지 렌더링
- [ ] 바위: 🪨 이모지 160px + Canvas 균열 오버레이
- [ ] 탭 영역: TAPPING 화면 전체에 `onTouchStart` 핸들러
- [ ] 햅틱: `navigator.vibrate?.(6)` 탭당
- [ ] 진행 바: CSS transition 없음 (즉각 반응)
- [ ] 컨페티: minhwa-coloring `CompleteScreen.jsx` 패턴 재사용
- [ ] 안전 영역: `env(safe-area-inset-*)` 적용
- [ ] 스트릭 배지: `🔥{n}일` 형태, 헤더 우측 고정
