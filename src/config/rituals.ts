import { RitualRecipe } from '@/types';

export const RITUALS: RitualRecipe[] = [
  {
    id: 'ritual_evening_reset',
    name: '睡前淨空 12’',
    description: '拉伸 + 日記，讓今晚入睡更順。',
    inputs: ['focusShard', 'clarityShard'],
    cooldownHours: 24,
    window: 'evening',
    steps: ['伸展 8 分鐘', '寫 4 句日記'],
    benefits: ['壓力 -5', '今夜能量 +8'],
    durationMinutes: 12,
    effect: {
      id: 'buff_evening_reset',
      kind: 'buff',
      name: '睡前淨空',
      stacks: 1,
      effects: [
        { target: 'stress', math: 'add', value: -5 },
        { target: 'energy', math: 'add', value: 8 }
      ],
      source: 'ritual',
    },
  },
  {
    id: 'ritual_focus_anchor',
    name: '番茄啟動 25+5',
    description: '桌面清理 + 呼吸 2’。幫當下的專注加速。',
    inputs: ['focusShard', 'focusShard'],
    cooldownHours: 8,
    window: 'am',
    steps: ['桌面清理', '呼吸練習 2 分鐘'],
    benefits: ['專注 +12', '壓力 -3'],
    durationMinutes: 7,
    effect: {
      id: 'buff_focus_anchor',
      kind: 'buff',
      name: '番茄啟動',
      stacks: 1,
      effects: [
        { target: 'focus', math: 'add', value: 12 },
        { target: 'stress', math: 'add', value: -3 }
      ],
      source: 'ritual',
    },
  },
  {
    id: 'ritual_low_fatigue_meal',
    name: '低疲勞餐備 20’',
    description: '採買 + 單鍋料理，為隔日累積能量。',
    inputs: ['clarityShard', 'clarityShard'],
    cooldownHours: 24,
    window: 'pm',
    steps: ['購買新鮮食材', '料理 2 份餐盒'],
    benefits: ['隔日營養分數下限 +1'],
    durationMinutes: 20,
    effect: {
      id: 'buff_low_fatigue_meal',
      kind: 'buff',
      name: '低疲勞餐備',
      stacks: 1,
      effects: [
        { target: 'nutritionScore', math: 'add', value: 3 },
        { target: 'energy', math: 'add', value: 5 }
      ],
      source: 'ritual',
    },
  },
  {
    id: 'ritual_morning_sun',
    name: '晨光重啟 15’',
    description: '晨間輕活動 + 曬太陽，啟動全日心情。',
    inputs: ['focusShard', 'clarityShard'],
    cooldownHours: 24,
    window: 'am',
    steps: ['快走 10 分鐘', '戶外光照 5 分鐘'],
    benefits: ['心情 +2', '熬夜衝動 -1'],
    durationMinutes: 15,
    effect: {
      id: 'buff_morning_sun',
      kind: 'buff',
      name: '晨光重啟',
      stacks: 1,
      effects: [
        { target: 'mood', math: 'add', value: 2 },
        { target: 'sleepDebt', math: 'add', value: -1 }
      ],
      source: 'ritual',
    },
  },
  {
    id: 'ritual_pre_run',
    name: '跑前暖身 10’',
    description: '泡沫軸 + 動態關節暖身，讓訓練更順。',
    inputs: ['focusShard', 'clarityShard'],
    cooldownHours: 12,
    window: 'pm',
    steps: ['泡沫滾軸 5 分鐘', '動態伸展 5 分鐘'],
    benefits: ['運動效率 +10%', '受傷風險 -10%'],
    durationMinutes: 10,
    effect: {
      id: 'buff_pre_run',
      kind: 'buff',
      name: '跑前暖身',
      stacks: 1,
      effects: [
        { target: 'health', math: 'add', value: 5 },
        { target: 'energy', math: 'add', value: 4 }
      ],
      source: 'ritual',
    },
  },
  {
    id: 'ritual_writing_sprint',
    name: '寫作衝刺 45’',
    description: '資料蒐集 + 關機斷網，保持清晰輸出。',
    inputs: ['focusShard', 'focusShard', 'clarityShard'],
    cooldownHours: 24,
    window: 'pm',
    steps: ['整理資料 15 分鐘', '斷網專注 30 分鐘'],
    benefits: ['清明 +1', '完成率上升'],
    durationMinutes: 45,
    effect: {
      id: 'buff_writing_sprint',
      kind: 'buff',
      name: '寫作衝刺',
      stacks: 1,
      effects: [
        { target: 'clarity', math: 'add', value: 1 },
        { target: 'focus', math: 'add', value: 8 }
      ],
      source: 'ritual',
    },
  },
  {
    id: 'ritual_social_reset',
    name: '社交能量整理 8’',
    description: '訊息歸零 + 三件小善，補回社交能量。',
    inputs: ['clarityShard', 'clarityShard'],
    cooldownHours: 24,
    window: 'evening',
    steps: ['訊息清零', '完成三件小善'],
    benefits: ['壓力 -5', '能量上限 +5'],
    durationMinutes: 8,
    effect: {
      id: 'buff_social_reset',
      kind: 'buff',
      name: '社交能量整理',
      stacks: 1,
      effects: [
        { target: 'stress', math: 'add', value: -5 },
        { target: 'energy', math: 'add', value: 5 }
      ],
      source: 'ritual',
    },
  }
];

export function getRitual(id: string): RitualRecipe | undefined {
  return RITUALS.find(r => r.id === id);
}
