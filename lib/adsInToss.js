/**
 * 앱인토스 광고 API 래퍼
 * minhwa-coloring/lib/adsInToss.js 패턴 동일
 */

const AD_UNIT_ID = 'ait-ad-test-rewarded-id'

function isAppsInTossEnvironment() {
  return typeof window !== 'undefined' &&
    (window.AppsInToss !== undefined ||
     window.webkit?.messageHandlers?.AppsInToss !== undefined)
}

async function loadRealAd() {
  return new Promise((resolve, reject) => {
    try {
      window.loadAppsInTossAdMob?.({
        adUnitId: AD_UNIT_ID,
        onLoaded: () => resolve(),
        onError: (err) => reject(new Error(err)),
      })
      setTimeout(() => reject(new Error('광고 로드 타임아웃')), 10000)
    } catch (err) {
      reject(err)
    }
  })
}

async function showRealAd() {
  return new Promise((resolve, reject) => {
    try {
      window.showAppsInTossAdMob?.({
        adUnitId: AD_UNIT_ID,
        onCompleted: () => resolve(true),
        onSkipped: () => resolve(false),
        onError: (err) => reject(new Error(err)),
      })
      setTimeout(() => reject(new Error('광고 표시 타임아웃')), 60000)
    } catch (err) {
      reject(err)
    }
  })
}

async function showMockAd() {
  console.log('[광고 모의] 광고 표시 중... (3초)')
  await new Promise(resolve => setTimeout(resolve, 3000))
  console.log('[광고 모의] 완료!')
  return true
}

export async function showAd() {
  try {
    if (isAppsInTossEnvironment()) {
      await loadRealAd()
      return await showRealAd()
    } else {
      return await showMockAd()
    }
  } catch (error) {
    console.error('광고 오류:', error)
    return true
  }
}
