import { EventCard } from '@/types';

export const DailyEvents: EventCard[] = [
  // 工作 / 學業壓力
  {
    id: 'ev_overtime',
    name: '臨時加班',
    text: '主管請你處理臨時任務，今晚恐怕得加班。',
    rarity: 'common',
    weekday: [1,2,3,4,5],
    requires: [{ field: 'sleepDebt', op: '<=', value: 6 }],
    crisis: { rescueIds: ['ev_rest_break', 'ev_go_home_early'] },
    choices: [
      { id: 'stay', label: '留下完成（溫和）', effects: { sleepDebt: 1, stress: 5 } },
      { id: 'split', label: '分段拆解（中性）', effects: { focus: 5, stress: -2 } },
      { id: 'counter', label: '溝通延期（積極）', effects: { stress: -4, mood: 1 } }
    ]
  },
  {
    id: 'ev_rest_break',
    name: '午間喘息',
    text: '你爭取到 20 分鐘喘口氣的時間。',
    rarity: 'common',
    rescue: true,
    requires: [{ field: 'sleepDebt', op: '>=', value: 1 }],
    choices: [
      { id: 'nap', label: '閉眼休息', effects: { stress: -5, energy: 6 } },
      { id: 'walk', label: '到陽台走走', effects: { stress: -3, focus: 3 } }
    ]
  },
  {
    id: 'ev_go_home_early',
    name: '提前收工',
    text: '你向主管爭取提早半小時收工。',
    rarity: 'uncommon',
    chain: { chainId: 'overtime_chain', stage: 1, nextId: 'ev_evening_release' },
    choices: [
      { id: 'leave', label: '馬上離開', effects: { stress: -6, energy: 8 } },
      { id: 'handoff', label: '交接再走', effects: { focus: 4, stress: -3 } }
    ]
  },
  {
    id: 'ev_evening_release',
    name: '晚間釋放',
    text: '回家後你想把壓力徹底釋放。',
    rarity: 'uncommon',
    chain: { chainId: 'overtime_chain', stage: 2 },
    choices: [
      { id: 'stretch', label: '伸展 10 分鐘', effects: { stress: -6, mood: 2 } },
      { id: 'share', label: '跟朋友分享', effects: { mood: 3, stress: -3 } }
    ]
  },
  {
    id: 'ev_flash_brief',
    name: '臨時簡報',
    text: '隔天一早需上台簡報，時間緊迫。',
    rarity: 'uncommon',
    requires: [{ field: 'focus', op: '>=', value: 40 }],
    choices: [
      { id: 'outline', label: '列出重點', effects: { focus: 6, stress: 3 } },
      { id: 'rehearse', label: '模擬 10 分鐘', effects: { focus: 4, mood: -1 } },
      { id: 'delegate', label: '請同事協助', effects: { stress: -5, mood: 1 } }
    ]
  },
  {
    id: 'ev_mentor_check',
    name: '導師檢查進度',
    text: '導師問你這週研究或功課的進展。',
    rarity: 'uncommon',
    chain: { chainId: 'mentor_chain', stage: 1, nextId: 'ev_mentor_followup' },
    choices: [
      { id: 'report', label: '回報目前狀況', effects: { focus: 5, stress: 2 } },
      { id: 'reschedule', label: '爭取下週再談', effects: { stress: -4, mood: -1 } }
    ]
  },
  {
    id: 'ev_mentor_followup',
    name: '導師提醒',
    text: '導師給出新的建議與提醒。',
    rarity: 'common',
    chain: { chainId: 'mentor_chain', stage: 2 },
    choices: [
      { id: 'accept', label: '接受建議', effects: { focus: 4, mood: 1 } },
      { id: 'adjust', label: '調整計畫', effects: { focus: 3, stress: -2 } }
    ]
  },
  {
    id: 'ev_exam_anxiety',
    name: '考前焦慮',
    text: '重要考試或發表前夕，心跳加快。',
    rarity: 'common',
    crisis: { rescueIds: ['ev_breathing_reset', 'ev_walk_revision'] },
    choices: [
      { id: 'cram', label: '再讀一輪', effects: { focus: 4, stress: 5 } },
      { id: 'pause', label: '暫停呼吸 5 分鐘', effects: { stress: -6, mood: 1 } }
    ]
  },
  {
    id: 'ev_breathing_reset',
    name: '深呼吸重置',
    text: '你花五分鐘做深呼吸，讓心跳慢下來。',
    rarity: 'common',
    rescue: true,
    choices: [
      { id: 'breathe', label: '深呼吸', effects: { stress: -5, focus: 2 } }
    ]
  },
  {
    id: 'ev_walk_revision',
    name: '快走複習',
    text: '你邊走邊複習筆記，讓腦袋轉換節奏。',
    rarity: 'uncommon',
    rescue: true,
    choices: [
      { id: 'walk', label: '戶外快走 10 分鐘', effects: { focus: 3, energy: 4 } }
    ]
  },
  {
    id: 'ev_crunch_cycle',
    name: '專案緊繃週',
    text: '專案進入衝刺期，團隊士氣需要維持。',
    rarity: 'rare',
    weekday: [1,2,3,4],
    requires: [{ field: 'focus', op: '>=', value: 60 }],
    choices: [
      { id: 'motivate', label: '激勵團隊', effects: { mood: 3, stress: 4 } },
      { id: 'scope', label: '重新界定範圍', effects: { stress: -4, focus: 3 } }
    ]
  },

  // 健康 / 能量
  {
    id: 'ev_light_cold',
    name: '輕微感冒',
    text: '你開始喉嚨癢、鼻塞，可能要休息。',
    rarity: 'common',
    crisis: { rescueIds: ['ev_early_rest', 'ev_warm_soup'] },
    choices: [
      { id: 'push', label: '照常工作', effects: { health: -5, energy: -5 } },
      { id: 'rest', label: '提早收工', effects: { health: 4, focus: -2 } }
    ]
  },
  {
    id: 'ev_early_rest',
    name: '提早休息',
    text: '你安排自己今晚 22:30 前入睡。',
    rarity: 'common',
    rescue: true,
    choices: [
      { id: 'sleep', label: '準時睡覺', effects: { sleepDebt: -1, energy: 6 } }
    ]
  },
  {
    id: 'ev_warm_soup',
    name: '暖湯修復',
    text: '你煮了一碗暖湯補充營養。',
    rarity: 'common',
    rescue: true,
    choices: [
      { id: 'drink', label: '喝下暖湯', effects: { nutritionScore: 2, mood: 1 } }
    ]
  },
  {
    id: 'ev_stiff_back',
    name: '久坐腰緊',
    text: '長時間坐著讓腰背感到緊繃。',
    rarity: 'common',
    requires: [{ field: 'focus', op: '>=', value: 30 }],
    crisis: { rescueIds: ['ev_back_stretch', 'ev_physio_visit'] },
    choices: [
      { id: 'ignore', label: '撐住繼續', effects: { health: -4, stress: 2 } },
      { id: 'stretch', label: '立刻起身伸展', effects: { health: 3, focus: -2 } }
    ]
  },
  {
    id: 'ev_back_stretch',
    name: '伸展 8 分鐘',
    text: '你做了一輪拉伸和核心啟動。',
    rarity: 'common',
    rescue: true,
    choices: [
      { id: 'do', label: '跟著影片做', effects: { health: 4, stress: -3 } }
    ]
  },
  {
    id: 'ev_physio_visit',
    name: '物理治療建議',
    text: '你預約了物理治療師諮詢。',
    rarity: 'uncommon',
    rescue: true,
    choices: [
      { id: 'schedule', label: '安排時間', effects: { health: 5, stress: -2 } }
    ]
  },
  {
    id: 'ev_hydration_gap',
    name: '水分不足',
    text: '今天的水量不足，注意補充。',
    rarity: 'common',
    choices: [
      { id: 'water', label: '立刻喝 500ml', effects: { health: 2, focus: 2 } },
      { id: 'infuse', label: '泡檸檬水', effects: { mood: 1, stress: -1 } }
    ]
  },
  {
    id: 'ev_step_challenge',
    name: '步數挑戰',
    text: '朋友邀你一起達成一萬步。',
    rarity: 'uncommon',
    weekday: [5,6],
    choices: [
      { id: 'accept', label: '一起挑戰', effects: { health: 4, energy: -3 } },
      { id: 'solo', label: '自己慢走', effects: { health: 3, stress: -2 } }
    ]
  },
  {
    id: 'ev_midnight_snack',
    name: '宵夜誘惑',
    text: '深夜感到飢餓，考慮是否吃宵夜。',
    rarity: 'common',
    choices: [
      { id: 'eat', label: '吃低油宵夜', effects: { nutritionScore: -2, mood: 1 } },
      { id: 'tea', label: '喝無糖茶', effects: { stress: -1, sleepDebt: 0 } },
      { id: 'sleep', label: '立即入睡', effects: { sleepDebt: -1, energy: 4 } }
    ]
  },

  // 社交 / 家庭
  {
    id: 'ev_family_dinner',
    name: '家庭晚餐',
    text: '家人相約週末一起吃飯。',
    rarity: 'common',
    weekday: [5,6],
    choices: [
      { id: 'join', label: '赴約共餐', effects: { mood: 3, nutritionScore: 1 } },
      { id: 'takeout', label: '外帶回家吃', effects: { stress: -2, mood: 1 } }
    ]
  },
  {
    id: 'ev_friend_workout',
    name: '朋友揪運動',
    text: '朋友 rsvp 想和你一起去健身房。',
    rarity: 'common',
    choices: [
      { id: 'join', label: '一起訓練', effects: { health: 4, stress: -2 } },
      { id: 'observe', label: '去陪練', effects: { mood: 2, energy: -2 } }
    ]
  },
  {
    id: 'ev_care_parent',
    name: '照顧家人',
    text: '家人身體不適，需要你的協助。',
    rarity: 'uncommon',
    crisis: { rescueIds: ['ev_neighbor_help', 'ev_remote_support'] },
    choices: [
      { id: 'care', label: '親自照顧', effects: { stress: 4, mood: 2 } },
      { id: 'schedule', label: '安排看診', effects: { stress: 2, focus: -2 } }
    ]
  },
  {
    id: 'ev_neighbor_help',
    name: '鄰居幫忙',
    text: '鄰居主動提出可以照應家人。',
    rarity: 'common',
    rescue: true,
    choices: [
      { id: 'accept', label: '接受好意', effects: { stress: -4, mood: 2 } }
    ]
  },
  {
    id: 'ev_remote_support',
    name: '遠端聯絡',
    text: '你準備整理醫囑遠端提醒。',
    rarity: 'common',
    rescue: true,
    choices: [
      { id: 'organize', label: '建立提醒表', effects: { focus: 3, stress: -2 } }
    ]
  },
  {
    id: 'ev_conflict_mild',
    name: '輕微誤會',
    text: '與同事誤會，需要消弭。',
    rarity: 'common',
    choices: [
      { id: 'clarify', label: '當面說清', effects: { stress: -3, focus: 2 } },
      { id: 'msg', label: '用訊息溝通', effects: { stress: -2, mood: 0 } }
    ]
  },
  {
    id: 'ev_support_friend',
    name: '朋友求助',
    text: '朋友今天情緒低落，找你聊聊。',
    rarity: 'common',
    choices: [
      { id: 'listen', label: '傾聽與陪伴', effects: { mood: 2, stress: -1 } },
      { id: 'advice', label: '給予建議', effects: { focus: 2, mood: 1 } }
    ]
  },

  // 自我成長
  {
    id: 'ev_focus_sprint',
    name: '專注衝刺',
    text: '你想安排一段深度工作時段。',
    rarity: 'common',
    chain: { chainId: 'focus_chain', stage: 1, nextId: 'ev_focus_retrospect' },
    choices: [
      { id: 'block', label: '規劃 90 分鐘', effects: { focus: 6, stress: 2 } },
      { id: 'short', label: '30 分鐘試水溫', effects: { focus: 3, stress: 0 } }
    ]
  },
  {
    id: 'ev_focus_retrospect',
    name: '專注回顧',
    text: '結束專注時段，做個回顧。',
    rarity: 'common',
    chain: { chainId: 'focus_chain', stage: 2 },
    choices: [
      { id: 'journal', label: '寫下心得', effects: { clarity: 1, mood: 1 } },
      { id: 'share', label: '和夥伴分享', effects: { mood: 2, stress: -1 } }
    ]
  },
  {
    id: 'ev_reading_binge',
    name: '閱讀馬拉松',
    text: '你想完成一本書的重點章節。',
    rarity: 'uncommon',
    choices: [
      { id: 'outline', label: '做筆記', effects: { focus: 4, stress: 1 } },
      { id: 'skim', label: '快速瀏覽', effects: { focus: 2, mood: 1 } }
    ]
  },
  {
    id: 'ev_skill_micro',
    name: '技能小練習',
    text: '你想精進某項能力，安排 15 分鐘練習。',
    rarity: 'common',
    choices: [
      { id: 'practice', label: '立刻練習', effects: { focus: 3, mood: 1 } },
      { id: 'plan', label: '寫下練習計畫', effects: { clarity: 1, focus: 2 } }
    ]
  },
  {
    id: 'ev_dopamine_diet',
    name: '多巴胺潔食日',
    text: '你想減少螢幕與糖份，專注內在。',
    rarity: 'rare',
    weekday: [0],
    choices: [
      { id: 'commit', label: '今日全程執行', effects: { focus: 6, mood: 2 } },
      { id: 'half', label: '中午後再開始', effects: { focus: 3, stress: -1 } }
    ]
  },

  // 生活維護
  {
    id: 'ev_room_refresh',
    name: '房間刷新',
    text: '你的房間需要整理，舒適度下降。',
    rarity: 'common',
    choices: [
      { id: 'declutter', label: '整理 15 分鐘', effects: { mood: 2, focus: 2 } },
      { id: 'schedule', label: '安排週末整理', effects: { stress: -2, mood: 0 } }
    ]
  },
  {
    id: 'ev_fridge_empty',
    name: '冰箱見底',
    text: '冰箱快空了，需要補貨。',
    rarity: 'common',
    choices: [
      { id: 'shop', label: '食材採買', effects: { nutritionScore: 3, energy: -3 } },
      { id: 'delivery', label: '訂購菜箱', effects: { nutritionScore: 2, stress: -1 } }
    ]
  },
  {
    id: 'ev_weekly_review',
    name: '週計畫回顧',
    text: '到了週末，該整理下週行程。',
    rarity: 'common',
    weekday: [0,6],
    choices: [
      { id: 'review', label: '列出下週三件事', effects: { clarity: 1, focus: 2 } },
      { id: 'skip', label: '明天再說', effects: { stress: 2, mood: -1 } }
    ]
  },
  {
    id: 'ev_travel_plan',
    name: '旅行前準備',
    text: '你準備下週的小旅行。',
    rarity: 'uncommon',
    chain: { chainId: 'travel_chain', stage: 1, nextId: 'ev_travel_day' },
    choices: [
      { id: 'pack', label: '列清單', effects: { focus: 3, stress: -2 } },
      { id: 'budget', label: '整理預算', effects: { stress: -1, mood: 1 } }
    ]
  },
  {
    id: 'ev_travel_day',
    name: '旅行日',
    text: '今天正式出發旅行。',
    rarity: 'common',
    chain: { chainId: 'travel_chain', stage: 2, nextId: 'ev_travel_reset' },
    choices: [
      { id: 'enjoy', label: '全心享受', effects: { mood: 4, energy: -3 } },
      { id: 'document', label: '紀錄亮點', effects: { clarity: 1, mood: 2 } }
    ]
  },
  {
    id: 'ev_travel_reset',
    name: '旅行後復位',
    text: '旅行結束，回到現實需要調整。',
    rarity: 'common',
    chain: { chainId: 'travel_chain', stage: 3 },
    choices: [
      { id: 'laundry', label: '洗衣整理', effects: { stress: -3, focus: 2 } },
      { id: 'rest', label: '休息半日', effects: { sleepDebt: -1, energy: 6 } }
    ]
  },
  {
    id: 'ev_bills_due',
    name: '帳單到期',
    text: '多張帳單同時到期，需立即處理。',
    rarity: 'common',
    choices: [
      { id: 'pay', label: '馬上繳清', effects: { stress: -3, focus: 2 } },
      { id: 'plan', label: '設定自動扣款', effects: { stress: -2, clarity: 1 } }
    ]
  },
  {
    id: 'ev_morning_light',
    name: '晨光重啟',
    text: '早上想感受自然光與活動。',
    rarity: 'common',
    weekday: [0,6],
    choices: [
      { id: 'walk', label: '散步 15 分鐘', effects: { mood: 2, energy: 4 } },
      { id: 'stretch', label: '陽台伸展', effects: { mood: 2, stress: -2 } }
    ]
  },

  // 補充事件
  {
    id: 'ev_deep_clean',
    name: '深度打掃',
    text: '你決定進行一次深度清潔。',
    rarity: 'uncommon',
    weekday: [6],
    choices: [
      { id: 'full', label: '全套打掃', effects: { mood: 3, energy: -4 } },
      { id: 'zone', label: '分區進行', effects: { mood: 2, stress: -1 } }
    ]
  },
  {
    id: 'ev_meal_prep',
    name: '餐備日',
    text: '你預備一週的健康餐盒。',
    rarity: 'common',
    choices: [
      { id: 'cook', label: '集中煮餐', effects: { nutritionScore: 3, energy: -5 } },
      { id: 'batch', label: '分批準備', effects: { nutritionScore: 2, stress: -1 } }
    ]
  },
  {
    id: 'ev_sanity_walk',
    name: '理智小走',
    text: '覺得焦躁時的小散步。',
    rarity: 'common',
    choices: [
      { id: 'walk', label: '走 8 分鐘', effects: { stress: -4, mood: 2 } },
      { id: 'stretch', label: '原地拉伸', effects: { stress: -2, focus: 1 } }
    ]
  },
  {
    id: 'ev_focus_dip',
    name: '午后低潮',
    text: '午後精神下降，需要提振。',
    rarity: 'common',
    crisis: { rescueIds: ['ev_power_nap', 'ev_move_boost'] },
    choices: [
      { id: 'caffeine', label: '喝咖啡', effects: { focus: 4, sleepDebt: 0 } },
      { id: 'break', label: '短暫休息', effects: { stress: -2, focus: 2 } }
    ]
  },
  {
    id: 'ev_power_nap',
    name: '強力小睡',
    text: '你找到 15 分鐘小睡的機會。',
    rarity: 'common',
    rescue: true,
    choices: [
      { id: 'nap', label: '小睡', effects: { energy: 6, stress: -3 } }
    ]
  },
  {
    id: 'ev_move_boost',
    name: '活力提升',
    text: '你做了幾組徒手訓練，讓血液循環。',
    rarity: 'common',
    rescue: true,
    choices: [
      { id: 'movement', label: '徒手訓練', effects: { energy: 5, mood: 2 } }
    ]
  }
];
