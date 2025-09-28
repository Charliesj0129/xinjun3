import * as SQLite from 'expo-sqlite';
import { Resource, ActionLog, RoomState, Rule, StatusEffect, HabitKey, HabitStats, TimelineEntry, TimelineDelta } from '@/types';

const db = SQLite.openDatabase('xinjun3.db');
export const database = db;

export function initDb() {
  db.transaction(tx => {
    tx.executeSql(`CREATE TABLE IF NOT EXISTS resources (
      date TEXT PRIMARY KEY,
      energy INTEGER, stress INTEGER, focus INTEGER, health INTEGER,
      sleepDebt INTEGER, nutritionScore INTEGER, mood INTEGER, clarity INTEGER
    );`);
    tx.executeSql(`CREATE TABLE IF NOT EXISTS actions (
      id TEXT PRIMARY KEY,
      date TEXT, type TEXT, payload TEXT
    );`);
    tx.executeSql(`CREATE TABLE IF NOT EXISTS rooms (
      date TEXT PRIMARY KEY,
      bedroom_dark INTEGER, bedroom_temp INTEGER, bedroom_tidy INTEGER,
      desk_declutter INTEGER, desk_timer INTEGER,
      gym_prepared INTEGER, kitchen_prep INTEGER
    );`);
    tx.executeSql(`CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY, enabled INTEGER,
      if_field TEXT, if_op TEXT, if_value REAL, then_action TEXT, then_params TEXT
    );`);
    tx.executeSql(`CREATE TABLE IF NOT EXISTS effects (
      id TEXT PRIMARY KEY,
      date TEXT,
      kind TEXT,
      name TEXT,
      stacks INTEGER,
      maxStacks INTEGER,
      expiresAt TEXT,
      payload TEXT
    );`);
    tx.executeSql(`CREATE TABLE IF NOT EXISTS habit_stats (
      habit TEXT PRIMARY KEY,
      date TEXT,
      streak INTEGER,
      momentumStacks INTEGER,
      lastActiveAt TEXT,
      decayGraceDays INTEGER
    );`);
    tx.executeSql(`CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      createdAt TEXT,
      type TEXT,
      payload TEXT
    );`);
    tx.executeSql(`CREATE TABLE IF NOT EXISTS timeline (
      id TEXT PRIMARY KEY,
      at TEXT,
      kind TEXT,
      refId TEXT,
      actionType TEXT,
      choiceId TEXT,
      delta TEXT
    );`);
    const ignoreDups = () => false;
    tx.executeSql(`ALTER TABLE rules ADD COLUMN priority INTEGER`, [], () => {}, ignoreDups);
    tx.executeSql(`ALTER TABLE rules ADD COLUMN cooldownSec INTEGER`, [], () => {}, ignoreDups);
    tx.executeSql(`ALTER TABLE rules ADD COLUMN lastFiredAt TEXT`, [], () => {}, ignoreDups);
    tx.executeSql(`ALTER TABLE rules ADD COLUMN logic TEXT`, [], () => {}, ignoreDups);
  });
}

export function upsertResource(r: Resource): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO resources (date, energy, stress, focus, health, sleepDebt, nutritionScore, mood, clarity)
         VALUES (?,?,?,?,?,?,?,?,?)
         ON CONFLICT(date) DO UPDATE SET
           energy=excluded.energy, stress=excluded.stress, focus=excluded.focus, health=excluded.health,
           sleepDebt=excluded.sleepDebt, nutritionScore=excluded.nutritionScore, mood=excluded.mood, clarity=excluded.clarity
        `,
        [r.date, r.energy, r.stress, r.focus, r.health, r.sleepDebt, r.nutritionScore, r.mood, r.clarity],
        () => resolve(),
        (_, err) => { reject(err); return false; }
      );
    });
  });
}

export function getResource(date:string): Promise<Resource | null> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(`SELECT * FROM resources WHERE date=?`, [date], (_, { rows }) => {
        if (rows.length > 0) resolve(rows.item(0) as Resource);
        else resolve(null);
      }, (_, err) => { reject(err); return false; });
    });
  });
}

export function insertAction(a: ActionLog): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT OR REPLACE INTO actions (id, date, type, payload) VALUES (?,?,?,?)`,
        [a.id, a.date, a.type, JSON.stringify(a.payload)],
        () => resolve(),
        (_, err) => { reject(err); return false; }
      );
    });
  });
}

export function listActions(date:string): Promise<ActionLog[]> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(`SELECT * FROM actions WHERE date=?`, [date], (_, { rows }) => {
        const out: ActionLog[] = [];
        for (let i=0;i<rows.length;i++) {
          const r=rows.item(i);
          out.push({ id:r.id, date:r.date, type:r.type, payload: JSON.parse(r.payload||'{}') });
        }
        resolve(out);
      }, (_, err) => { reject(err); return false; });
    });
  });
}

export function getRoomState(date:string): Promise<RoomState | null> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(`SELECT * FROM rooms WHERE date=?`, [date], (_, { rows }) => {
        if (!rows.length) {
          resolve(null);
          return;
        }
        const r = rows.item(0);
        resolve({
          date: r.date,
          bedroom: {
            dark: !!r.bedroom_dark,
            tempOk: !!r.bedroom_temp,
            tidy: !!r.bedroom_tidy,
          },
          desk: {
            declutter: !!r.desk_declutter,
            timer: !!r.desk_timer,
          },
          gym: {
            prepared: !!r.gym_prepared,
          },
          kitchen: {
            prep: !!r.kitchen_prep,
          },
        });
      }, (_, err) => { reject(err); return false; });
    });
  });
}

type EffectRow = {
  id: string;
  date: string;
  kind: string;
  name: string;
  stacks: number;
  maxStacks?: number;
  expiresAt?: string;
  payload?: string;
};

function mapEffectRow(row: EffectRow): StatusEffect {
  let parsed: any = {};
  try {
    parsed = row.payload ? JSON.parse(row.payload) : {};
  } catch (err) {
    parsed = {};
  }
  return {
    id: row.id,
    kind: row.kind === 'debuff' ? 'debuff' : 'buff',
    name: row.name,
    stacks: row.stacks ?? 0,
    maxStacks: row.maxStacks ?? undefined,
    expiresAt: row.expiresAt ?? undefined,
    effects: parsed.effects ?? [],
    source: parsed.source,
  };
}

export function listEffects(): Promise<{ date:string; effect: StatusEffect }[]> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(`SELECT * FROM effects`, [], (_, { rows }) => {
        const out: { date:string; effect:StatusEffect }[] = [];
        for (let i=0;i<rows.length;i++) {
          const r = rows.item(i) as EffectRow;
          out.push({ date: r.date, effect: mapEffectRow(r) });
        }
        resolve(out);
      }, (_, err) => { reject(err); return false; });
    });
  });
}

export function upsertEffectRecord(date:string, e: StatusEffect): Promise<void> {
  const payload = JSON.stringify({ effects: e.effects, source: e.source });
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO effects (id, date, kind, name, stacks, maxStacks, expiresAt, payload)
         VALUES (?,?,?,?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET
           date=excluded.date,
           kind=excluded.kind,
           name=excluded.name,
           stacks=excluded.stacks,
           maxStacks=excluded.maxStacks,
           expiresAt=excluded.expiresAt,
           payload=excluded.payload
        `,
        [e.id, date, e.kind, e.name, e.stacks, e.maxStacks ?? null, e.expiresAt ?? null, payload],
        () => resolve(),
        (_, err) => { reject(err); return false; }
      );
    });
  });
}

export function deleteEffect(id:string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(`DELETE FROM effects WHERE id=?`, [id], () => resolve(), (_, err) => { reject(err); return false; });
    });
  });
}

export function expireEffectsBefore(isoCutoff: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(`DELETE FROM effects WHERE expiresAt IS NOT NULL AND expiresAt <= ?`, [isoCutoff], () => resolve(), (_, err) => { reject(err); return false; });
    });
  });
}

type HabitRow = {
  habit: HabitKey;
  date: string;
  streak: number;
  momentumStacks: number;
  lastActiveAt: string;
  decayGraceDays: number;
};

function mapHabitRow(row: HabitRow): HabitStats {
  return {
    habit: row.habit,
    date: row.date ?? '',
    streak: row.streak ?? 0,
    momentumStacks: row.momentumStacks ?? 0,
    lastActiveAt: row.lastActiveAt ?? row.date ?? '',
    decayGraceDays: row.decayGraceDays ?? 0,
  };
}

export function getHabitStat(habit: HabitKey): Promise<HabitStats | null> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM habit_stats WHERE habit=?`,
        [habit],
        (_, { rows }) => {
          if (!rows.length) {
            resolve(null);
            return;
          }
          resolve(mapHabitRow(rows.item(0) as HabitRow));
        },
        (_, err) => { reject(err); return false; }
      );
    });
  });
}

export function setHabitStat(stat: HabitStats): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO habit_stats (habit, date, streak, momentumStacks, lastActiveAt, decayGraceDays)
         VALUES (?,?,?,?,?,?)
         ON CONFLICT(habit) DO UPDATE SET
           date=excluded.date,
           streak=excluded.streak,
           momentumStacks=excluded.momentumStacks,
           lastActiveAt=excluded.lastActiveAt,
           decayGraceDays=excluded.decayGraceDays
        `,
        [stat.habit, stat.date, stat.streak, stat.momentumStacks, stat.lastActiveAt, stat.decayGraceDays],
        () => resolve(),
        (_, err) => { reject(err); return false; }
      );
    });
  });
}

export function listHabitStats(): Promise<HabitStats[]> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(`SELECT * FROM habit_stats`, [], (_, { rows }) => {
        const out: HabitStats[] = [];
        for (let i = 0; i < rows.length; i++) {
          out.push(mapHabitRow(rows.item(i) as HabitRow));
        }
        resolve(out);
      }, (_, err) => { reject(err); return false; });
    });
  });
}

type TimelineRow = {
  id: string;
  at: string;
  kind: string;
  refId: string;
  actionType?: string;
  choiceId?: string;
  delta?: string;
};

function mapTimelineRow(row: TimelineRow): TimelineEntry {
  let delta: TimelineDelta | undefined;
  if (row.delta) {
    try {
      delta = JSON.parse(row.delta) as TimelineDelta;
    } catch (err) {
      delta = undefined;
    }
  }
  return {
    id: row.id,
    at: row.at,
    kind: row.kind as TimelineEntry['kind'],
    refId: row.refId,
    actionType: row.actionType ?? undefined,
    choiceId: row.choiceId ?? undefined,
    delta,
  };
}

export function insertTimelineEntry(entry: TimelineEntry): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO timeline (id, at, kind, refId, actionType, choiceId, delta)
         VALUES (?,?,?,?,?,?,?)`,
        [
          entry.id,
          entry.at,
          entry.kind,
          entry.refId,
          entry.actionType ?? null,
          entry.choiceId ?? null,
          entry.delta ? JSON.stringify(entry.delta) : null,
        ],
        () => resolve(),
        (_, err) => { reject(err); return false; }
      );
    });
  });
}

export function listTimeline(date: string, limit = 200): Promise<TimelineEntry[]> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM timeline WHERE substr(at,1,10)=? ORDER BY at ASC LIMIT ?`,
        [date, limit],
        (_, { rows }) => {
          const out: TimelineEntry[] = [];
          for (let i = 0; i < rows.length; i++) {
            out.push(mapTimelineRow(rows.item(i) as TimelineRow));
          }
          resolve(out);
        },
        (_, err) => { reject(err); return false; }
      );
    });
  });
}

export function clearTimeline(date: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(`DELETE FROM timeline WHERE substr(at,1,10)=?`, [date], () => resolve(), (_, err) => { reject(err); return false; });
    });
  });
}

export function listResourcesInRange(startDate: string, endDate: string): Promise<Resource[]> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM resources WHERE date BETWEEN ? AND ? ORDER BY date ASC`,
        [startDate, endDate],
        (_, { rows }) => {
          const out: Resource[] = [];
          for (let i = 0; i < rows.length; i++) {
            const r = rows.item(i);
            out.push({
              date: r.date,
              energy: r.energy,
              stress: r.stress,
              focus: r.focus,
              health: r.health,
              sleepDebt: r.sleepDebt,
              nutritionScore: r.nutritionScore,
              mood: r.mood,
              clarity: r.clarity,
            });
          }
          resolve(out);
        },
        (_, err) => { reject(err); return false; }
      );
    });
  });
}

export function listAllResources(): Promise<Resource[]> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(`SELECT * FROM resources ORDER BY date ASC`, [], (_, { rows }) => {
        const out: Resource[] = [];
        for (let i = 0; i < rows.length; i++) {
          const r = rows.item(i);
          out.push({
            date: r.date,
            energy: r.energy,
            stress: r.stress,
            focus: r.focus,
            health: r.health,
            sleepDebt: r.sleepDebt,
            nutritionScore: r.nutritionScore,
            mood: r.mood,
            clarity: r.clarity,
          });
        }
        resolve(out);
      }, (_, err) => { reject(err); return false; });
    });
  });
}

export function listAllActions(): Promise<ActionLog[]> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(`SELECT * FROM actions ORDER BY date ASC`, [], (_, { rows }) => {
        const out: ActionLog[] = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows.item(i);
          out.push({
            id: row.id,
            date: row.date,
            type: row.type,
            payload: row.payload ? JSON.parse(row.payload) : {},
          });
        }
        resolve(out);
      }, (_, err) => { reject(err); return false; });
    });
  });
}

export function clearAllData(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(`DELETE FROM resources`);
      tx.executeSql(`DELETE FROM actions`);
      tx.executeSql(`DELETE FROM timeline`);
      tx.executeSql(`DELETE FROM effects`);
      tx.executeSql(`DELETE FROM habit_stats`);
    }, err => reject(err), () => resolve());
  });
}
