const DB_NAME = 'simstrike-db';
const STORE = 'marketHistory';

export const loadUsers = () => JSON.parse(localStorage.getItem('simstrike-users') || '{}');
export const saveUsers = (users) => localStorage.setItem('simstrike-users', JSON.stringify(users));

export function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addMarketPoint(point) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add(point);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listMarketHistory(limit = 80) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result.slice(-limit));
    req.onerror = () => reject(req.error);
  });
}
