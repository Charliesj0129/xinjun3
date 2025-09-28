import { EventCard } from '@/types';

export const DailyEvents: EventCard[] = [
  {
    id: 'ev_friend',
    name: '朋友臨時相約',
    text: '朋友傳訊問你要不要出門小聚？',
    rarity: 'common',
    choices: [
      { id:'accept', label:'出門放鬆',
        effects:{ mood: 1, stress: -5, energy: -5 } },
      { id:'decline', label:'婉拒專心工作',
        effects:{ focus: 10, mood: -1 } }
    ]
  },
  {
    id: 'ev_overtime',
    name: '臨時加班',
    text: '主管請你處理臨時任務…',
    rarity: 'common',
    choices: [
      { id:'stay', label:'留下加班',
        effects:{ sleepDebt: 1, stress: 5 } },
      { id:'negotiate', label:'協調明天處理',
        effects:{ stress: -3, focus: 5 } }
    ]
  }
];
