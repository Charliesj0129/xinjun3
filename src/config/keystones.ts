export type Keystone = {
  id: string;
  name: string;
  description: string;
  modifiers: {
    focusGainMult?: number;
    stressIncreaseMult?: number;
    sleepGainMult?: number;
    nutritionGainMult?: number;
    journalClarityGain?: number;
  };
};

export const KEYSTONES: Keystone[] = [
  {
    id: 'keystone_focus_loop',
    name: '專注迴圈',
    description: '日記與睡眠帶來額外的專注收益。',
    modifiers: { focusGainMult: 1.1, journalClarityGain: 1.1 },
  },
  {
    id: 'keystone_calm_pressure',
    name: '靜流減壓',
    description: '任何壓力增加量減少。',
    modifiers: { stressIncreaseMult: 0.85 },
  },
  {
    id: 'keystone_rest_engine',
    name: '休息引擎',
    description: '睡眠與飲食的恢復成效提高。',
    modifiers: { sleepGainMult: 1.15, nutritionGainMult: 1.1 },
  }
];

export function nextKeystone(unlocked: string[]): Keystone | null {
  return KEYSTONES.find(k => !unlocked.includes(k.id)) ?? null;
}
