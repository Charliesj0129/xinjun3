import { EventCard } from '@/types';

export const DailyEvents: EventCard[] = [
  {
    id: 'ev_friend',
    name: '朋友臨時相約',
    text: '朋友傳訊問你要不要出門小聚？',
    rarity: 'common',
    weekday: [5,6],
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
    requires: [{ field:'sleepDebt', op:'<=', value:6 }],
    crisis: { rescueIds:['ev_rest_break','ev_go_home_early'] },
    choices: [
      { id:'stay', label:'留下加班',
        effects:{ sleepDebt: 1, stress: 5 } },
      { id:'negotiate', label:'協調明天處理',
        effects:{ stress: -3, focus: 5 } }
    ]
  },
  {
    id: 'ev_rest_break',
    name: '午間喘息',
    text: '主管同意你去休息 20 分鐘。',
    rarity: 'common',
    requires:[{ field:'sleepDebt', op:'>=', value:1 }],
    choices: [
      { id:'rest', label:'好好休息', effects:{ stress: -4, energy: 5 } }
    ]
  },
  {
    id: 'ev_go_home_early',
    name: '提前收工',
    text: '你爭取提前下班，留點力氣給自己。',
    rarity: 'uncommon',
    chain:{ chainId:'overtime_chain', stage:1, nextId:'ev_evening_release' },
    choices: [
      { id:'leave', label:'按時離開', effects:{ stress: -6, energy: 8 } }
    ]
  },
  {
    id: 'ev_evening_release',
    name: '晚間釋放',
    text: '你選擇用一個小儀式把壓力放掉。',
    rarity: 'uncommon',
    chain:{ chainId:'overtime_chain', stage:2 },
    choices: [
      { id:'stretch', label:'做 10 分鐘伸展', effects:{ stress: -5, mood: 2 } },
      { id:'call', label:'打給朋友聊聊', effects:{ mood: 3, stress: -2 } }
    ]
  }
];
