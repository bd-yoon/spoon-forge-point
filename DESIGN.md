# spoon-forge-point — DESIGN.md

> 최종 업데이트: 2026-03-07
> 담당: Designer Agent
> 적용 원칙: 토스 5대 원칙 (One Thing Per Page, Value First, No Loading, Tap & Scroll, Sleek Experience)
> 주의: `@toss/tds-mobile` import 금지 (Vercel 빌드 실패). 모든 UI는 Tailwind CSS + framer-motion으로 구현.

---

## 0. 토스 Product Principle & 앱인토스 디자인 가이드

### 토스 5대 Product Principle — 이 서비스에서의 적용

| 원칙 | 설명 | 이 서비스 적용 사례 |
|------|------|-----------------|
| **One Thing Per Page** | 화면당 하나의 메시지/액션만 | MAIN(탭핑), REVEAL(수저 공개), COLLECTION(보관함) — 화면별 단일 목적 |
| **Value First** | 이점 먼저, 정보 요청은 나중 | 무료 2회 먼저 제공 → 기회 소진 후 광고 오퍼 표시 (광고부터 강요하지 않음) |
| **No Loading** | 대기 시간 제거 또는 숨기기 | Pre-roll 방식 — 탭 시작 시 수저 이미 결정, REVEAL에서 지연 없음 |
| **Tap & Scroll** | 세로 스크롤 + 탭만 사용 | 바위 탭핑이 핵심 인터랙션. 세로 스크롤 레이아웃 |
| **Sleek Experience** | 미묘한 애니메이션으로 세련된 느낌 | 수저 spring 등장, 등급별 파티클(P1-A), 풀스크린 연출(P1-B), shake(P2), 교환 이펙트(P3) |

### 앱인토스 Non-Game WebView 규칙

| 항목 | 규칙 | 준수 여부 |
|------|------|---------|
| TDS 컴포넌트 | 비게임은 TDS 필수 (Button 최소 1개) | ⚠️ TDS 미사용 — Vercel 빌드 실패 이슈로 Tailwind 대체. 심사 시 주의 필요 |
| 커스텀 네비게이션 바 | 금지 | ✅ 없음 |
| 토스 하단 탭 모방 | 금지 | ✅ 없음 |
| 이모지 아이콘 | 앱 UI에 이모지 아이콘 사용 금지 | ⚠️ 버튼/카드 내 이모지 텍스트 사용 중 — 추후 SVG로 교체 권장 |
| `granite.config.ts` | `type: 'partner'`, `outdir: 'out'` | ✅ 설정 완료 |
| AdMob 권한 | `permissions: ['admob']` 필수 | ✅ 설정 완료 |
| 앱 아이콘 | 600×600 정사각형, 투명 픽셀 없음 | ☐ `tools/generate-assets.html` 생성 필요 |
| 확률 고지 | 확률형 아이템은 확률 공시 필수 | ✅ COLLECTION 화면에 법적 고지 포함 |

> **TDS 미사용 배경**: `@toss/tds-mobile` import 시 Vercel 빌드 실패 (ESM/CJS 충돌). 앱인토스 샌드박스에서는 Tailwind Button으로 심사 통과 여부 확인 필요.

### 구현 완료 현황

| 개선 항목 | 상태 | 커밋 |
|---------|------|------|
| P1-A: 수저 공개 등급별 파티클 차별화 | ✅ 완료 | `8bf54d6` |
| P1-B: 다이아/금수저 풀스크린 연출 | ✅ 완료 | `8bf54d6` |
| P2: 균열 단계별 shake 이펙트 | ✅ 완료 | `8bf54d6` |
| P3: 교환 완료 성공 이펙트 | ✅ 완료 | `8bf54d6` |

---

## 1. 화면 상태 머신

```
MAIN (바위 탭핑)
    ↓ [탭 완료 or 무료기회 소진]
REVEAL (수저 공개 애니메이션)
    ↓ [확인 버튼]
MAIN 복귀 or COLLECTION 진입

COLLECTION (보관함)
    ↓ [교환 버튼]
MAIN 복귀
```

**일일 리셋**: KST 자정 기준 — `freeAttempts`, `hammerUsed`, `diamondBoostExpiry` 초기화

**광고 플로우 (3 placements — 수익화 핵심)**
- `handleAdAttempt()` → 기회 1회 추가 (최대 3회/일)
- `handleAdHammer()` → 해머 강화 당일 1회 (탭수 절반)
- `handleAdDiamond()` → 다이아 부스터 1시간 (확률 ×10)

---

## 2. 화면별 설계

### 2-1. MAIN (바위 탭핑)

**목적**: 바위를 탭핑해 수저를 뽑는 핵심 루프. 탭할수록 균열이 깊어지고 기대감이 높아진다.

**레이아웃 (위→아래)**
```
[진행도 바: 오늘 탭 수 / 목표 탭 수]  #0064FF
[바위 아이콘: 200px, idle 말풍선 (3~6초 간격)]
  ← 탭 시: 바운스 + 균열 오버레이 (3단계)
  ← 탭 시: Canvas 파티클 (8개, 회색 계열)
[상태 가이드 텍스트: 단계별 4종]
[하단 카드: 오늘 기회 현황 + 광고 오퍼 버튼]
  [해머 강화 버튼 (ADS 배지)] [다이아 부스터 버튼 (ADS 배지)]
[보관함 링크 카드 →]
```

**버튼 구현**: Tailwind CSS + framer-motion (TDS 미사용)

**애니메이션 스펙**
- 바위 idle: `y:[0,-6,0]` 2.5s infinite (framer-motion)
- 바운스: `scale:[1,0.90,1.05,1]` 0.18s
- 균열 3단계: opacity 0.4 → 0.7 → 폭발 표시
- 파티클: Canvas, 8개/탭, `['#8B95A1','#A0A8B0','#6B7280','#C5CDD6']`, 중력 0.3

---

### 2-2. REVEAL (수저 공개)

**목적**: 수저 획득의 결과를 극적으로 연출한다. 등급이 높을수록 더 강한 이펙트 (개선 항목).

**레이아웃**
```
[수저 아이콘: Spring 애니메이션 등장]
  ← 다이아/금수저 시: 풀스크린 연출 (개선 P1-B)
[티어 라벨 + 가치 텍스트]
[컨페티 파티클: 등급별 차별화 (개선 P1-A)]
[포인트 카운트업: 600ms linear]
[확인 버튼: Tailwind 커스텀]
```

---

### 2-3. COLLECTION (보관함)

**목적**: 획득한 수저 목록을 보여주고 토스포인트 교환을 트리거한다.

**레이아웃**
```
[헤더: 보관함]
[수저 3열 그리드]
[총 보유 포인트]
[교환 버튼: 10원 이상 시 활성 / Tailwind 커스텀]
[교환 완료 성공 이펙트] ← 개선 P3
```

---

## 3. 색상 팔레트

**배경**
- 페이지: `linear-gradient(180deg, #C5E8F8 0%, #E8F4FF 55%, #F0F8FF 100%)`

**텍스트**
| 토큰 | HEX | 용도 |
|------|-----|------|
| 메인 텍스트 | `#191F28` | 제목, 주요 텍스트 |
| 서브 텍스트 | `#6B7684` | 설명 |
| 비활성 | `#B0B8C1` | disabled 상태 |
| 토스 블루 | `#0064FF` | 버튼, 진행도 바, 주요 액션 |

**수저 티어별 색상**
| 티어 | 색상 | 글로우 | 값 | 확률 |
|------|------|-------|-----|------|
| Diamond | `#5BCEFA` | `rgba(91,206,250,0.3)` | 1,000원 | 0.001% |
| Gold | `#F5A623` | `rgba(245,166,35,0.3)` | 10원 | 10% |
| Silver | `#A0A8B0` | `rgba(160,168,176,0.3)` | 5원 | 20% |
| Bronze | `#CD7F32` | `rgba(205,127,50,0.3)` | 3원 | 30% |
| Stone | `#6B7280` | `rgba(107,114,128,0.2)` | 1원 | 40% |

---

## 4. 개선 명세 (우선순위순)

### P1-A: 수저 공개 화면 — 등급별 차별화 파티클 + 컨페티

**목표**: REVEAL 화면에서 획득 등급에 따라 파티클 색상, 밀도, 크기를 다르게 해 희귀 수저 획득 시 특별한 성취감을 준다.

**적용 위치**: `spoon-forge-point/components/RevealScreen.jsx` (또는 해당 파일)

**스펙 — 등급별 파티클 테이블**
| 티어 | 파티클 수 | 색상 | 크기 | 추가 효과 |
|------|---------|------|------|---------|
| Stone | 20개 | `#8B95A1` 회색 계열 | 2~4px | 없음 |
| Bronze | 30개 | `#CD7F32` 계열 | 2~5px | 없음 |
| Silver | 40개 | `#A0A8B0` 계열 | 3~6px | 없음 |
| Gold | 50개 | `#F5A623` + `#FFD700` | 3~7px | 화면 상단 컨페티 낙하 |
| Diamond | 60개 | `#5BCEFA` + `#FFF` | 4~8px | P1-B 풀스크린 연출 |

**구현 패턴**: 기존 `RevealScreen.jsx`의 컨페티 60개 로직에서 `tier` 파라미터 분기 추가
```javascript
const TIER_PARTICLE_CONFIG = {
  stone:   { count: 20, colors: ['#8B95A1', '#A0A8B0'] },
  bronze:  { count: 30, colors: ['#CD7F32', '#E8A045'] },
  silver:  { count: 40, colors: ['#A0A8B0', '#C5CDD6', '#fff'] },
  gold:    { count: 50, colors: ['#F5A623', '#FFD700', '#fff'] },
  diamond: { count: 60, colors: ['#5BCEFA', '#A0E8FF', '#fff'] },
};
```

**코드 참조**
- `spoon-forge-point/components/RevealScreen.jsx` — 현재 컨페티 60개 로직
- 기존 Canvas 파티클 시스템 (MainScreen.jsx) 패턴 재활용

---

### P1-B: 다이아/금수저 획득 시 풀스크린 연출

**목표**: 다이아(0.001%) 또는 금수저(10%) 획득 시 전용 연출로 "특별한 순간"을 만든다.

**적용 위치**: `RevealScreen.jsx` — `tier === 'diamond' || tier === 'gold'` 분기

**다이아 연출 스펙**
```
1. 배경 전환: 기존 배경 → #1A2A4A (딥 블루), duration 0.5s ease-in
2. 수저 등장: scale 0 → 1.3 → 1.0, spring(stiffness:120, damping:14) + 0→360deg 회전
3. 글로우 원: 수저 중심 → radius 200px, rgba(91,206,250,0.4), duration 0.8s ease-out
4. 별 파티클: 20개, 흰색 + 하늘색, 전체 화면 방사형 발산
5. 텍스트 글로우: "다이아 수저 획득!" text-shadow 0 0 20px #5BCEFA
6. 배경 복원: 1.5s 후 fade-back
```

**금수저 연출 스펙**
```
1. 배경 전환: 기존 → #2A1A00 (딥 골드), duration 0.4s
2. 수저 등장: scale 0 → 1.2 → 1.0, spring(stiffness:160, damping:16)
3. 글로우 원: rgba(245,166,35,0.35), radius 160px
4. 컨페티: 금색 #F5A623 계열 30개 낙하
5. 배경 복원: 1.2s 후 fade-back
```

**Framer Motion 패턴**
```javascript
// RevealScreen 마운트 시 tier 체크
useEffect(() => {
  if (tier === 'diamond') triggerDiamondReveal();
  else if (tier === 'gold') triggerGoldReveal();
}, [tier]);
```

**코드 참조**
- `RevealScreen.jsx` — 기존 `spring stiffness:280 damping:20` 수저 등장 로직
- 배경 전환: framer-motion `motion.div` `backgroundColor` animate

---

### P2: 균열 애니메이션 단계별 진동감 강화

**목표**: 바위 탭핑 시 균열 단계가 올라갈수록 화면 진동감을 높여 물리적 타격감을 제공한다.

**적용 위치**: `MainScreen.jsx` — 균열 단계 업데이트 (`crackStage` 변경) 시점

**스펙**
```
Stage 1 진입 (탭 25% 완료): 바위 컨테이너 x:[-2,2,-2,0] duration 0.15s
Stage 2 진입 (탭 60% 완료): 바위 컨테이너 x:[-4,4,-4,4,0] duration 0.20s + scale:[1,1.03,1] 0.15s
Stage 3 진입 (탭 100% 완료): x:[-6,6,-6,6,-6,0] duration 0.30s + scale:[1,1.06,0.95,1] 0.25s
```

**Framer Motion 구현**
```javascript
const shakeVariants = {
  stage1: { x: [-2, 2, -2, 0], transition: { duration: 0.15 } },
  stage2: { x: [-4, 4, -4, 4, 0], transition: { duration: 0.20 } },
  stage3: { x: [-6, 6, -6, 6, -6, 0], transition: { duration: 0.30 } },
  idle: { x: 0 }
};
// crackStage useEffect → animate('stage1'/'stage2'/'stage3')
```

**코드 참조**
- `MainScreen.jsx` — 균열 단계 상태 변수 (crackStage 또는 동일 역할 변수)
- 기존 `whileTap={{ scale: 0.90 }}` 패턴 참고

---

### P3: 보관함 교환 완료 성공 이펙트

**목표**: 포인트 교환 완료 시 시각적 피드백으로 성취감 제공.

**적용 위치**: `CollectionScreen.jsx` — 교환 완료 콜백

**스펙**
```
1. 체크마크 (✓): 중앙 scale 0→1.2→1, spring(stiffness:300, damping:20), 색상 #0064FF
2. "교환 완료!" 텍스트: opacity 0→1, y:10→0, duration 0.3s
3. 포인트 숫자: 현재값 → 0, 카운트다운 600ms linear
4. 2s 후 성공 상태 fade-out → 일반 상태 복귀
```

**Tailwind 클래스 패턴**
```javascript
const [exchangeSuccess, setExchangeSuccess] = useState(false);
// 교환 완료 시 setExchangeSuccess(true)
// setTimeout(() => setExchangeSuccess(false), 2000)
```

---

## 5. 앱스토어 에셋 계획

| 에셋 | 크기 | 컨셉 |
|------|------|------|
| 로고 (라이트) | 600×600 | 하늘색 배경 + 황금 숟가락 아이콘 |
| 로고 (다크) | 600×600 | 딥 블루 배경 + 다이아 수저 글로우 |
| 썸네일 | 1000×1000 | 수저 5종 배치 + "숟가락 대장간" 텍스트 |
| 썸네일 와이드 | 1932×828 | 바위 탭핑 → 수저 공개 플로우 |
| 프리뷰 1 | 636×1048 | MAIN 화면 (바위 균열 2단계) |
| 프리뷰 2 | 636×1048 | REVEAL 화면 (금수저 획득 연출) |
| 프리뷰 3 | 636×1048 | REVEAL 화면 (다이아 수저 풀스크린) |
| 프리뷰 4 | 636×1048 | COLLECTION 보관함 화면 |

**생성 도구**: `spoon-forge-point/tools/generate-assets.html` (신규 생성 필요)
**브랜드 색상**: `#0064FF`

---

## 6. 미니앱 브랜딩 가이드 준수 체크리스트

- [x] 로고: 600×600 정사각형
- [x] 브랜드명 한글: "숟가락 대장간"
- [x] 브랜드 색상 HEX: `#0064FF`
- [x] 커스텀 네비게이션 바 없음
- [x] TDS 미사용 (Vercel 빌드 실패 이슈 — Tailwind + framer-motion 사용)
- [x] Non-Game WebView 타입 (`granite.config.ts`: `type: 'partner'`)
- [x] AdMob 권한: `permissions: ['admob']`
