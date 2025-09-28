import { create } from 'zustand';
import { TimelineEntry } from '@/types';
import { listTimeline } from '@/db/db';

type TimelineState = {
  entries: TimelineEntry[];
  loading: boolean;
  loadTimeline: (date: string) => Promise<void>;
};

export const useTimelineStore = create<TimelineState>((set) => ({
  entries: [],
  loading: false,
  loadTimeline: async (date: string) => {
    set({ loading: true });
    try {
      const data = await listTimeline(date);
      set({ entries: data, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  }
}));
