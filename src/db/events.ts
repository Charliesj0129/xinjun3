import { database } from './db';
import { GameEvent } from '@/types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function appendEvent(type: string, payload: Record<string, any>, createdAt?: string): Promise<void> {
  const id = generateId();
  const timestamp = createdAt ?? new Date().toISOString();
  return new Promise((resolve, reject) => {
    database.transaction(tx => {
      tx.executeSql(
        `INSERT INTO events (id, createdAt, type, payload) VALUES (?,?,?,?)`,
        [id, timestamp, type, JSON.stringify(payload || {})],
        () => resolve(),
        (_, err) => { reject(err); return false; }
      );
    });
  });
}

export function listEvents(limit = 100, offset = 0): Promise<GameEvent[]> {
  return new Promise((resolve, reject) => {
    database.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM events ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
        [limit, offset],
        (_, { rows }) => {
          const out: GameEvent[] = [];
          for (let i = 0; i < rows.length; i++) {
            const item = rows.item(i);
            let payload: Record<string, any> = {};
            try {
              payload = item.payload ? JSON.parse(item.payload) : {};
            } catch (err) {
              payload = {};
            }
            out.push({ id: item.id, createdAt: item.createdAt, type: item.type, payload });
          }
          resolve(out);
        },
        (_, err) => { reject(err); return false; }
      );
    });
  });
}
