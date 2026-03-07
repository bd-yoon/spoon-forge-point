import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

// KST 날짜 (서버에서도 동일 로직)
function getKSTDateStr() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

// 3개월 누적 + 다이아 1개 기준 상한
const MAX_AMOUNT = 3000
const MIN_AMOUNT = 10

export async function POST(request) {
  try {
    const body = await request.json()
    const { userId, amount } = body

    // 1. 기본 검증
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ message: '유저 정보가 없습니다' }, { status: 400 })
    }

    if (!Number.isInteger(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return NextResponse.json(
        { message: `교환 금액은 ${MIN_AMOUNT}~${MAX_AMOUNT}원 사이여야 합니다` },
        { status: 400 }
      )
    }

    // 2. 일일 교환 이력 확인
    const today = getKSTDateStr()

    const { data: existing, error: selectError } = await supabase
      .from('exchange_log')
      .select('id')
      .eq('user_key', userId)
      .eq('kst_date', today)
      .limit(1)

    if (selectError) {
      console.error('Supabase select error:', selectError)
      return NextResponse.json({ message: '서버 오류가 발생했습니다' }, { status: 500 })
    }

    if (existing && existing.length > 0) {
      return NextResponse.json({ message: '오늘 이미 교환했습니다' }, { status: 429 })
    }

    // 3. 교환 이력 기록
    const { error: insertError } = await supabase
      .from('exchange_log')
      .insert({
        user_key: userId,
        amount,
        kst_date: today,
      })

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return NextResponse.json({ message: '서버 오류가 발생했습니다' }, { status: 500 })
    }

    // 4. 성공 (v2: 여기서 executePromotion API 호출 추가)
    return NextResponse.json({ success: true, amount })

  } catch (e) {
    console.error('Exchange API error:', e)
    return NextResponse.json({ message: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
