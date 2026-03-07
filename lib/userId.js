const ls = () => typeof window !== 'undefined' ? window.localStorage : null

export function getUserId() {
  // TODO: @apps-in-toss/web-framework에서 유저 키 API 확인 후 1순위로 교체
  // 예: window.__APPS_IN_TOSS__?.userKey

  // 폴백: localStorage UUID
  const KEY = 'spoon_device_id'
  const store = ls()
  if (!store) return 'unknown'
  let id = store.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    store.setItem(KEY, id)
  }
  return id
}
