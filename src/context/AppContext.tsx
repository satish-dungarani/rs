import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, DiaryEntry } from '../db/localDB';
import {
  saveDirHandle,
  getSavedDirHandle,
  clearDirHandle,
  verifyPermission,
  registerUser,
  loginUser,
  getEntries,
  addEntry,
  updateEntry,
  deleteEntry,
} from '../db/localDB';

type Page = 'auth' | 'diary';

interface AppContextType {
  // Directory / storage
  dirHandle: FileSystemDirectoryHandle | null;
  dirName: string;
  isFileSystemSupported: boolean;
  pickDirectory: () => Promise<boolean>;
  disconnectDirectory: () => Promise<void>;
  reconnectSavedHandle: () => Promise<boolean>;
  hasSavedHandle: boolean;

  // Auth
  currentUser: User | null;
  page: Page;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (name: string, username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;

  // Diary entries
  entries: DiaryEntry[];
  loadEntries: () => Promise<void>;
  createEntry: (title: string, content: string, date: string) => Promise<DiaryEntry>;
  editEntry: (id: string, title: string, content: string, date: string) => Promise<DiaryEntry | null>;
  removeEntry: (id: string) => Promise<void>;

  // UI
  loading: boolean;
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;
  setNotification: (n: { type: 'success' | 'error' | 'info'; message: string } | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [dirName, setDirName] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>('auth');
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<AppContextType['notification']>(null);
  const [hasSavedHandle, setHasSavedHandle] = useState(false);

  const isFileSystemSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  // Check if we have a saved handle on mount
  useEffect(() => {
    (async () => {
      const saved = await getSavedDirHandle();
      setHasSavedHandle(!!saved);
    })();
  }, []);

  // Auto-clear notifications
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  const pickDirectory = useCallback(async (): Promise<boolean> => {
    try {
      if (!window.showDirectoryPicker) {
        setNotification({ type: 'error', message: 'Your browser does not support the File System Access API. Please use Chrome or Edge.' });
        return false;
      }
      const handle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'diary-storage' });
      const granted = await verifyPermission(handle);
      if (!granted) {
        setNotification({ type: 'error', message: 'Permission denied. Please grant read/write access.' });
        return false;
      }
      await saveDirHandle(handle);
      setDirHandle(handle);
      setDirName(handle.name);
      setHasSavedHandle(true);
      setNotification({ type: 'success', message: `Connected to folder: ${handle.name}` });
      return true;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return false;
      setNotification({ type: 'error', message: 'Failed to select folder.' });
      return false;
    }
  }, []);

  const reconnectSavedHandle = useCallback(async (): Promise<boolean> => {
    const saved = await getSavedDirHandle();
    if (!saved) return false;
    const granted = await verifyPermission(saved);
    if (!granted) {
      setNotification({ type: 'info', message: 'Please grant permission again or select a new folder.' });
      return false;
    }
    setDirHandle(saved);
    setDirName(saved.name);
    return true;
  }, []);

  const disconnectDirectory = useCallback(async () => {
    await clearDirHandle();
    setDirHandle(null);
    setDirName('');
    setCurrentUser(null);
    setEntries([]);
    setPage('auth');
    setHasSavedHandle(false);
    setNotification({ type: 'info', message: 'Disconnected from folder.' });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    if (!dirHandle) return { success: false, message: 'No storage folder selected.' };
    setLoading(true);
    try {
      const result = await loginUser(dirHandle, username, password);
      if (result.success && result.user) {
        setCurrentUser(result.user);
        setPage('diary');
      }
      return { success: result.success, message: result.message };
    } finally {
      setLoading(false);
    }
  }, [dirHandle]);

  const register = useCallback(async (name: string, username: string, password: string) => {
    if (!dirHandle) return { success: false, message: 'No storage folder selected.' };
    setLoading(true);
    try {
      const result = await registerUser(dirHandle, name, username, password);
      return { success: result.success, message: result.message };
    } finally {
      setLoading(false);
    }
  }, [dirHandle]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setEntries([]);
    setPage('auth');
    setNotification({ type: 'info', message: 'Logged out successfully.' });
  }, []);

  const loadEntries = useCallback(async () => {
    if (!dirHandle || !currentUser) return;
    setLoading(true);
    try {
      const data = await getEntries(dirHandle, currentUser.id);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }, [dirHandle, currentUser]);

  const createEntry = useCallback(async (title: string, content: string, date: string) => {
    if (!dirHandle || !currentUser) throw new Error('Not connected');
    const entry = await addEntry(dirHandle, currentUser.id, title, content, date);
    setEntries((prev) => [entry, ...prev]);
    return entry;
  }, [dirHandle, currentUser]);

  const editEntry = useCallback(async (id: string, title: string, content: string, date: string) => {
    if (!dirHandle) return null;
    const entry = await updateEntry(dirHandle, id, title, content, date);
    if (entry) {
      setEntries((prev) => prev.map((e) => (e.id === id ? entry : e)));
    }
    return entry;
  }, [dirHandle]);

  const removeEntry = useCallback(async (id: string) => {
    if (!dirHandle) return;
    await deleteEntry(dirHandle, id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, [dirHandle]);

  return (
    <AppContext.Provider
      value={{
        dirHandle,
        dirName,
        isFileSystemSupported,
        pickDirectory,
        disconnectDirectory,
        reconnectSavedHandle,
        hasSavedHandle,
        currentUser,
        page,
        login,
        register,
        logout,
        entries,
        loadEntries,
        createEntry,
        editEntry,
        removeEntry,
        loading,
        notification,
        setNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
