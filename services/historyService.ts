
import { HistoryEntry, ViewType } from '../types';

const HISTORY_KEY = 'cecile_mystic_history';

export const saveHistoryEntry = (entry: Omit<HistoryEntry, 'id' | 'date'>) => {
  const history = getHistory();
  const newEntry: HistoryEntry = {
    ...entry,
    id: Math.random().toString(36).substr(2, 9),
    date: Date.now()
  };
  localStorage.setItem(HISTORY_KEY, JSON.stringify([newEntry, ...history].slice(0, 50)));
};

export const getHistory = (): HistoryEntry[] => {
  const saved = localStorage.getItem(HISTORY_KEY);
  return saved ? JSON.parse(saved) : [];
};

export const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};
