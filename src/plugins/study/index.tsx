import { PluginDefinition } from "@/plugins/types";
import manifest from "./manifest.json";
import { StudyScreen } from "./StudyScreen";

export const StudyPlugin: PluginDefinition = {
  manifest,
  screens: [
    {
      route: 'StudyPlugin',
      label: '番茄學習',
      component: StudyScreen,
    },
  ],
  actions: [
    {
      id: 'action.tomato_session',
      label: '番茄 25+5',
      description: '進行 25 分鐘專注與 5 分鐘休息，專注提升、壓力降低。',
      run: async ({ date, applyAction }) => {
        await applyAction({
          id: `${Date.now()}`,
          date,
          type: 'journal',
          payload: { preset: 'tomato', focusMinutes: 25, restMinutes: 5 },
        });
      },
    },
  ],
};
