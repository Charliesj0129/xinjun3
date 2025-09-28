import { BuildId } from '@/types';

export type BuildModifiers = {
  focusGainMult: number;
  stressIncreaseMult: number;
  sleepGainMult: number;
  nutritionGainMult: number;
  journalClarityGain: number;
};

export type BuildTuning = {
  id: BuildId;
  name: string;
  description: string;
  modifiers: BuildModifiers;
};

export const BUILDS: Record<BuildId, BuildTuning> = {
  scholar: {
    id: 'scholar',
    name: 'Scholar',
    description: '專注與日記成長加成，維持穩定節奏。',
    modifiers: {
      focusGainMult: 1.25,
      stressIncreaseMult: 1,
      sleepGainMult: 1,
      nutritionGainMult: 1,
      journalClarityGain: 1.3,
    },
  },
  champion: {
    id: 'champion',
    name: 'Champion',
    description: '抗壓與身體資源回復更佳。',
    modifiers: {
      focusGainMult: 1,
      stressIncreaseMult: 0.75,
      sleepGainMult: 1.1,
      nutritionGainMult: 1.05,
      journalClarityGain: 1,
    },
  },
  zen: {
    id: 'zen',
    name: 'Zen',
    description: '睡眠效率與壓力管理兼具。',
    modifiers: {
      focusGainMult: 1,
      stressIncreaseMult: 0.65,
      sleepGainMult: 1.2,
      nutritionGainMult: 0.95,
      journalClarityGain: 1.1,
    },
  },
  builder: {
    id: 'builder',
    name: 'Builder',
    description: '飲食與能量補給優先，支援高工時日程。',
    modifiers: {
      focusGainMult: 0.95,
      stressIncreaseMult: 0.9,
      sleepGainMult: 1.05,
      nutritionGainMult: 1.2,
      journalClarityGain: 1,
    },
  },
};

export function getBuild(buildId: BuildId): BuildTuning {
  return BUILDS[buildId] ?? BUILDS.scholar;
}
