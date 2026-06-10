export type EmployeeStatus = 'in' | 'out' | 'off';

export interface Employee {
  id: number;
  name: string;
  role: string;
  gender?: string;
  mobile?: string;
  email?: string;
  photo?: string;
  off_days: string[];
  status: EmployeeStatus;
  last_action: string | null;
  active: boolean;
  display_order: number;
  pin_hash?: string;
}

export interface HistoryRow {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_role: string;
  action: 'clock_in' | 'clock_out';
  timestamp: string;
  verification_photo?: string;
  created_at: string;
}

export interface BackupRow {
  id: number;
  created_at: string;
  data: TimesheetDB;
}

export interface TimesheetDB {
  employees: Employee[];
  history: HistoryRow[];
  app_settings: Record<string, unknown>;
  backups: BackupRow[];
  meta: {
    nextHistoryId: number;
    nextBackupId: number;
  };
}

const DB_FILENAME = 'timesheet_database.json';

const defaultEmployees: Employee[] = [
  {
    id: 101,
    name: 'Ahsan Sardar',
    role: 'Online',
    gender: 'Male',
    mobile: '5551001',
    email: 'ahsan@local.company',
    off_days: ['Fri', 'Sat'],
    status: 'in',
    last_action: new Date().toISOString(),
    active: true,
    display_order: 1,
    pin_hash: 'MTExMQ==',
  },
  {
    id: 102,
    name: 'Azminaxazam',
    role: 'Till Operative',
    gender: 'Female',
    mobile: '5551002',
    email: 'azmina@local.company',
    off_days: ['Fri'],
    status: 'in',
    last_action: null,
    active: true,
    display_order: 2,
    pin_hash: 'MjIyMg==',
  },
  {
    id: 103,
    name: 'Bergamasco',
    role: 'Shop Floor Assistant',
    gender: 'Female',
    mobile: '5551003',
    email: 'bergamasco@local.company',
    off_days: ['Sun', 'Sat'],
    status: 'out',
    last_action: null,
    active: true,
    display_order: 3,
    pin_hash: 'MzMzMw==',
  },
  {
    id: 104,
    name: 'Bhupendra Cantilal',
    role: 'Admin',
    gender: 'Male',
    mobile: '5551004',
    email: 'bhupendra@local.company',
    off_days: ['Sun', 'Sat'],
    status: 'out',
    last_action: null,
    active: true,
    display_order: 4,
  },
  {
    id: 105,
    name: 'Brahmakumar S',
    role: 'Shop Floor Assistant',
    gender: 'Male',
    mobile: '5551005',
    email: 'brahma@local.company',
    off_days: ['Sun', 'Sat'],
    status: 'out',
    last_action: null,
    active: true,
    display_order: 5,
  },
  {
    id: 106,
    name: 'Dhara Narola',
    role: 'Till Operative',
    gender: 'Female',
    mobile: '5551006',
    email: 'dhara@local.company',
    off_days: ['Tue'],
    status: 'in',
    last_action: null,
    active: true,
    display_order: 6,
  },
  {
    id: 107,
    name: 'Dinesh Sharma',
    role: 'Shop Floor Assistant',
    gender: 'Male',
    mobile: '5551007',
    email: 'dinesh@local.company',
    off_days: ['Mon', 'Tue', 'Wed', 'Thu'],
    status: 'in',
    last_action: null,
    active: true,
    display_order: 7,
  },
  {
    id: 108,
    name: 'Eddy Mateus',
    role: 'Online',
    gender: 'Male',
    mobile: '5551008',
    email: 'eddy@local.company',
    off_days: ['Thu'],
    status: 'in',
    last_action: null,
    active: true,
    display_order: 8,
  },
  {
    id: 109,
    name: 'Eglantina Kika',
    role: 'Online',
    gender: 'Female',
    mobile: '5551009',
    email: 'eglantina@local.company',
    off_days: ['Wed'],
    status: 'out',
    last_action: null,
    active: true,
    display_order: 9,
  },
  {
    id: 110,
    name: 'Elham',
    role: 'Shop Floor Assistance',
    gender: 'Male',
    mobile: '5551010',
    email: 'elham@local.company',
    off_days: ['Mon', 'Tue', 'Wed', 'Thu'],
    status: 'in',
    last_action: null,
    active: true,
    display_order: 10,
  },
];

export const EMPTY_DB: TimesheetDB = {
  employees: defaultEmployees,
  history: [],
  app_settings: {
    theme: 'blue',
    pinVerificationEnabled: false,
    locationSettings: {
      radius: 100,
      storeIP: '51.155.156.11',
      latitude: '51.474219',
      ipEnabled: false,
      longitude: '-2.560349',
      gpsEnabled: false,
    },
    cameraVerificationEnabled: true,
    branding: {
      logo: 'https://s3-eu-west-1.amazonaws.com/images.linnlive.com/3fa0731b6e8d2a5bd04d89eebf16509d/manage_images/rajani%20logo.jpeg',
      name: 'Rajani Superstore',
      tagline: 'Time Management',
      phone: '+44 0000 000000',
      email: 'admin@rajani.local',
      address: 'Store Main Address',
    },
    adminPasswordHash: 'MTIzNA==',
  },
  backups: [],
  meta: {
    nextHistoryId: 1,
    nextBackupId: 1,
  },
};

async function getFileHandle(dirHandle: FileSystemDirectoryHandle): Promise<FileSystemFileHandle> {
  return dirHandle.getFileHandle(DB_FILENAME, { create: true });
}

export async function readTimesheetDB(dirHandle: FileSystemDirectoryHandle): Promise<TimesheetDB> {
  try {
    const fileHandle = await getFileHandle(dirHandle);
    const file = await fileHandle.getFile();
    const text = await file.text();
    if (!text.trim()) {
      await writeTimesheetDB(dirHandle, EMPTY_DB);
      return structuredClone(EMPTY_DB);
    }
    const parsed = JSON.parse(text) as Partial<TimesheetDB>;
    return {
      employees: parsed.employees ?? [...defaultEmployees],
      history: parsed.history ?? [],
      app_settings: parsed.app_settings ?? { ...EMPTY_DB.app_settings },
      backups: parsed.backups ?? [],
      meta: {
        nextHistoryId: parsed.meta?.nextHistoryId ?? 1,
        nextBackupId: parsed.meta?.nextBackupId ?? 1,
      },
    };
  } catch {
    await writeTimesheetDB(dirHandle, EMPTY_DB);
    return structuredClone(EMPTY_DB);
  }
}

export async function writeTimesheetDB(dirHandle: FileSystemDirectoryHandle, data: TimesheetDB): Promise<void> {
  const fileHandle = await getFileHandle(dirHandle);
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

export function sortedEmployees(employees: Employee[]): Employee[] {
  return [...employees].sort((a, b) => a.display_order - b.display_order);
}

export function isOffDay(employee: Employee, date: Date): boolean {
  const day = date.toLocaleDateString('en-US', { weekday: 'short' });
  return employee.off_days.includes(day);
}

export function getSetting<T>(db: TimesheetDB, key: string, fallback: T): T {
  const value = db.app_settings[key];
  return (value as T) ?? fallback;
}

export function formatAction(action: HistoryRow['action']): string {
  return action === 'clock_in' ? 'Clocked In' : 'Clocked Out';
}

export function totalHoursFromHistory(historyRows: HistoryRow[]): number {
  const sorted = [...historyRows].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  let inTime: Date | null = null;
  let hours = 0;
  for (const row of sorted) {
    if (row.action === 'clock_in') {
      inTime = new Date(row.timestamp);
    }
    if (row.action === 'clock_out' && inTime) {
      const outTime = new Date(row.timestamp);
      hours += Math.max(0, outTime.getTime() - inTime.getTime()) / 36e5;
      inTime = null;
    }
  }
  return Number(hours.toFixed(2));
}
