import { RitualRecipe } from '@/types';

export const RITUALS: RitualRecipe[] = [
  {
    id: 'ritual_evening_reset',
    name: '睡前淨空 12 分鐘',
    description: '消耗 1 focusShard + 1 clarityShard，降低壓力並提升臨睡能量。',
    inputs: ['focusShard', 'clarityShard'],
    cooldownHours: 24,
    effect: {
      id: 'buff_evening_reset',
      kind: 'buff',
      name: '睡前淨空',
      stacks: 1,
      expiresAt: undefined,
      effects: [
        { target: 'stress', math: 'add', value: -5 },
        { target: 'energy', math: 'add', value: 8 }
      ],
      source: 'ritual',
    },
  },
  {
    id: 'ritual_focus_anchor',
    name: '晨間專注錨定',
    description: '消耗 2 focusShard，當日焦點調整。',
    inputs: ['focusShard', 'focusShard'],
    cooldownHours: 12,
    effect: {
      id: 'buff_focus_anchor',
      kind: 'buff',
      name: '專注錨定',
      stacks: 1,
      effects: [
        { target: 'focus', math: 'add', value: 6 },
        { target: 'stress', math: 'add', value: -2 },
      ],
      source: 'ritual',
    },
  }
];

export function getRitual(id: string): RitualRecipe | undefined {
  return RITUALS.find(r => r.id === id);
}
