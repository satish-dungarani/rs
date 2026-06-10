// Local File System Database using File System Access API + IndexedDB fallback
// Data is stored as JSON files on the user's local computer

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseData {
  users: User[];
  entries: DiaryEntry[];
}

const EMPTY_DB: DatabaseData = { users: [], entries: [] };

// Store directory handle in IndexedDB so it persists across sessions
const IDB_NAME = 'diary-app-handles';
const IDB_STORE = 'handles';

function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDirHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openHandleDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(handle, 'dirHandle');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSavedDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openHandleDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get('dirHandle');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function clearDirHandle(): Promise<void> {
  const db = await openHandleDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete('dirHandle');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  try {
    const opts: FileSystemHandlePermissionDescriptor = { mode: 'readwrite' };
    if ((await handle.queryPermission(opts)) === 'granted') return true;
    if ((await handle.requestPermission(opts)) === 'granted') return true;
    return false;
  } catch {
    return false;
  }
}

const DB_FILENAME = 'diary_database.json';

async function getFileHandle(dirHandle: FileSystemDirectoryHandle): Promise<FileSystemFileHandle> {
  return await dirHandle.getFileHandle(DB_FILENAME, { create: true });
}

export async function readDatabase(dirHandle: FileSystemDirectoryHandle): Promise<DatabaseData> {
  try {
    const fileHandle = await getFileHandle(dirHandle);
    const file = await fileHandle.getFile();
    const text = await file.text();
    if (!text.trim()) return { ...EMPTY_DB };
    const data = JSON.parse(text) as DatabaseData;
    return {
      users: data.users || [],
      entries: data.entries || [],
    };
  } catch {
    return { ...EMPTY_DB };
  }
}

export async function writeDatabase(dirHandle: FileSystemDirectoryHandle, data: DatabaseData): Promise<void> {
  const fileHandle = await getFileHandle(dirHandle);
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// ---- CRUD Operations ----

export async function registerUser(
  dirHandle: FileSystemDirectoryHandle,
  name: string,
  username: string,
  password: string
): Promise<{ success: boolean; message: string; user?: User }> {
  const db = await readDatabase(dirHandle);
  const exists = db.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  if (exists) {
    return { success: false, message: 'Username already exists. Please choose another.' };
  }
  const user: User = {
    id: generateId(),
    name,
    username,
    password, // In a real app, hash this. Since it's local-only, storing as-is.
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  await writeDatabase(dirHandle, db);
  return { success: true, message: 'Registration successful!', user };
}

export async function loginUser(
  dirHandle: FileSystemDirectoryHandle,
  username: string,
  password: string
): Promise<{ success: boolean; message: string; user?: User }> {
  const db = await readDatabase(dirHandle);
  const user = db.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
  if (!user) {
    return { success: false, message: 'Invalid username or password.' };
  }
  return { success: true, message: 'Login successful!', user };
}

export async function getEntries(
  dirHandle: FileSystemDirectoryHandle,
  userId: string
): Promise<DiaryEntry[]> {
  const db = await readDatabase(dirHandle);
  return db.entries
    .filter((e) => e.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addEntry(
  dirHandle: FileSystemDirectoryHandle,
  userId: string,
  title: string,
  content: string,
  date: string
): Promise<DiaryEntry> {
  const db = await readDatabase(dirHandle);
  const entry: DiaryEntry = {
    id: generateId(),
    userId,
    title,
    content,
    date,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.entries.push(entry);
  await writeDatabase(dirHandle, db);
  return entry;
}

export async function updateEntry(
  dirHandle: FileSystemDirectoryHandle,
  entryId: string,
  title: string,
  content: string,
  date: string
): Promise<DiaryEntry | null> {
  const db = await readDatabase(dirHandle);
  const idx = db.entries.findIndex((e) => e.id === entryId);
  if (idx === -1) return null;
  db.entries[idx] = {
    ...db.entries[idx],
    title,
    content,
    date,
    updatedAt: new Date().toISOString(),
  };
  await writeDatabase(dirHandle, db);
  return db.entries[idx];
}

export async function deleteEntry(
  dirHandle: FileSystemDirectoryHandle,
  entryId: string
): Promise<void> {
  const db = await readDatabase(dirHandle);
  db.entries = db.entries.filter((e) => e.id !== entryId);
  await writeDatabase(dirHandle, db);
}

export async function updateUserProfile(
  dirHandle: FileSystemDirectoryHandle,
  userId: string,
  name: string,
  password?: string
): Promise<User | null> {
  const db = await readDatabase(dirHandle);
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  db.users[idx].name = name;
  if (password) db.users[idx].password = password;
  await writeDatabase(dirHandle, db);
  return db.users[idx];
}
