# 信鈞 3.0（缺氧風）— Expo + TypeScript Skeleton

## Quick Start
```bash
# 1) Install Expo CLI (optional)
npm i -g expo-cli

# 2) Install deps
npm install

# 3) Start
npx expo start
```

If Android/iOS build complains about versions, run `npx expo install` for each dependency to auto-resolve compatible versions.

## Project Highlights
- Tabs: Home / Actions / Rooms / Rules / Badges / Analytics
- State: Zustand
- Storage: SQLite (expo-sqlite)
- Core game loop: daily settlement, rules engine, buffs/debuffs
