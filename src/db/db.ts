import * as SQLite from 'expo-sqlite';
import { Resource, ActionLog, RoomState, Rule, StatusEffect } from '@/types';

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
    const ignoreDups = (_: any, __: any) => true;
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
