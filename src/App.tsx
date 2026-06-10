import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  ArrowLeft,
  BookUser,
  FolderOpen,
  Lock,
  LogOut,
  Search,
  Shield,
  Clock3,
  Plus,
  Trash2,
  Download,
  Database,
  RefreshCw,
  Upload,
  FileDown,
  FileUp,
  Eye,
  EyeOff,
  Pencil,
  Palette,
  Building2,
  MapPin,
  Network,
  Camera,
  HardDrive,
  ChevronDown,
  LockKeyhole,
  LoaderCircle,
} from 'lucide-react';
import {
  clearDirHandle,
  getSavedDirHandle,
  saveDirHandle,
  verifyPermission,
} from './db/localDB';
import {
  type Employee,
  type HistoryRow,
  type TimesheetDB,
  formatAction,
  getSetting,
  isOffDay,
  readTimesheetDB,
  sortedEmployees,
  totalHoursFromHistory,
  writeTimesheetDB,
} from './db/timesheetDB';

type Screen = 'home' | 'employee-list' | 'employee-detail' | 'admin-login' | 'admin';
type AdminTab = 'dashboard' | 'employees' | 'reports' | 'settings' | 'clean';

function nowTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function dateInputValue(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function badgeClass(status: 'in' | 'out' | 'off'): string {
  if (status === 'in') return 'bg-emerald-500/20 text-emerald-300';
  if (status === 'off') return 'bg-amber-500/20 text-amber-200';
  return 'bg-slate-500/20 text-slate-200';
}

const dayOptions = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const roleOptions = ['Online', 'Till Operative', 'Shop Floor Assistant', 'Admin', 'Cleaning & Hygiene'];

function hashPin(pin: string): string {
  return btoa(pin.split('').reverse().join(''));
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function makeAvatarDataUrl(name: string, gender: string): string {
  const seed = name.length + gender.length;
  const bg = seed % 2 === 0 ? '#1d4ed8' : '#7c3aed';
  const text = initials(name) || 'E';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='100%' height='100%' fill='${bg}'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='42' font-family='Arial'>${text}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');
  const [currentTime, setCurrentTime] = useState(nowTime());
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [dirName, setDirName] = useState('');
  const [hasSavedHandle, setHasSavedHandle] = useState(false);
  const [db, setDb] = useState<TimesheetDB | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [adminEmployeeSearch, setAdminEmployeeSearch] = useState('');
  const [employeePage, setEmployeePage] = useState(1);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    role: '',
    gender: 'Male',
    mobile: '',
    email: '',
    photo: '',
    off_days: ['Sun'] as string[],
    display_order: '',
    pin: '',
    active: true,
  });
  const [reportEmployeeId, setReportEmployeeId] = useState<number | 'all'>('all');
  const [reportStart, setReportStart] = useState(dateInputValue(new Date(Date.now() - 6 * 86400000)));
  const [reportEnd, setReportEnd] = useState(dateInputValue(new Date()));
  const [expandedSetting, setExpandedSetting] = useState<string>('accent');
  const [theme, setTheme] = useState('blue');
  const [brandingName, setBrandingName] = useState('Rajani Superstore');
  const [brandingTagline, setBrandingTagline] = useState('Time Management');
  const [brandingLogo, setBrandingLogo] = useState('');
  const [brandingPhone, setBrandingPhone] = useState('');
  const [brandingEmail, setBrandingEmail] = useState('');
  const [brandingAddress, setBrandingAddress] = useState('');
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [latitude, setLatitude] = useState('51.474219');
  const [longitude, setLongitude] = useState('-2.560349');
  const [radius, setRadius] = useState(100);
  const [ipEnabled, setIpEnabled] = useState(false);
  const [storeIP, setStoreIP] = useState('51.155.156.11');
  const [pinVerificationEnabled, setPinVerificationEnabled] = useState(false);
  const [cameraVerificationEnabled, setCameraVerificationEnabled] = useState(true);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const companyLogoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(nowTime()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    void (async () => {
      const saved = await getSavedDirHandle();
      setHasSavedHandle(Boolean(saved));
      if (!saved) return;
      await connectDirectory(saved, false);
    })();
  }, []);

  const employees = useMemo(() => sortedEmployees(db?.employees ?? []), [db]);

  const visibleEmployees = useMemo(() => {
    const q = search.toLowerCase().trim();
    const activeEmployees = employees.filter((e) => e.active);
    if (!q) return activeEmployees;
    return activeEmployees.filter((e) => e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q));
  }, [employees, search]);

  const adminEmployees = useMemo(() => {
    const q = adminEmployeeSearch.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter((e) => {
      const mobile = e.mobile ?? '';
      const email = e.email ?? '';
      return (
        e.name.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        mobile.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q)
      );
    });
  }, [employees, adminEmployeeSearch]);

  const pageSize = 10;
  const totalEmployeePages = Math.max(1, Math.ceil(adminEmployees.length / pageSize));
  const pagedEmployees = useMemo(() => {
    const start = (employeePage - 1) * pageSize;
    return adminEmployees.slice(start, start + pageSize);
  }, [adminEmployees, employeePage]);

  useEffect(() => {
    if (employeePage > totalEmployeePages) {
      setEmployeePage(totalEmployeePages);
    }
  }, [employeePage, totalEmployeePages]);

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId) ?? null,
    [employees, selectedEmployeeId]
  );

  const selectedEmployeeTodayHistory = useMemo(() => {
    if (!db || !selectedEmployee) return [];
    const today = new Date().toDateString();
    return db.history
      .filter((row) => row.employee_id === selectedEmployee.id && new Date(row.timestamp).toDateString() === today)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [db, selectedEmployee]);

  const inCount = useMemo(() => employees.filter((e) => e.status === 'in').length, [employees]);
  const outCount = useMemo(() => employees.filter((e) => e.status !== 'in').length, [employees]);

  async function connectDirectory(handle: FileSystemDirectoryHandle, allowPrompt = true): Promise<boolean> {
    const granted = allowPrompt
      ? await verifyPermission(handle)
      : (await handle.queryPermission({ mode: 'readwrite' })) === 'granted';
    if (!granted) {
      if (allowPrompt) {
        setToast({ type: 'err', msg: 'Folder permission denied.' });
      }
      return false;
    }
    const data = await readTimesheetDB(handle);
    setDirHandle(handle);
    setDirName(handle.name);
    setDb(data);
    const branding = getSetting(data, 'branding', {
      name: 'Rajani Superstore',
      tagline: 'Time Management',
      logo: '',
      phone: '',
      email: '',
      address: '',
    });
    const location = getSetting(data, 'locationSettings', {
      radius: 100,
      storeIP: '51.155.156.11',
      latitude: '51.474219',
      ipEnabled: false,
      longitude: '-2.560349',
      gpsEnabled: false,
    });
    setTheme(getSetting(data, 'theme', 'blue'));
    setBrandingName(branding.name ?? 'Rajani Superstore');
    setBrandingTagline(branding.tagline ?? 'Time Management');
    setBrandingLogo(branding.logo ?? '');
    setBrandingPhone(branding.phone ?? '');
    setBrandingEmail(branding.email ?? '');
    setBrandingAddress(branding.address ?? '');
    setPinVerificationEnabled(getSetting(data, 'pinVerificationEnabled', false));
    setCameraVerificationEnabled(getSetting(data, 'cameraVerificationEnabled', true));
    setRadius(Number(location.radius ?? 100));
    setLatitude(String(location.latitude ?? '51.474219'));
    setLongitude(String(location.longitude ?? '-2.560349'));
    setStoreIP(String(location.storeIP ?? '51.155.156.11'));
    setIpEnabled(Boolean(location.ipEnabled));
    setGpsEnabled(Boolean(location.gpsEnabled));
    await saveDirHandle(handle);
    setHasSavedHandle(true);
    setToast({ type: 'ok', msg: `Connected to folder: ${handle.name}` });
    return true;
  }

  async function browseFolder() {
    if (!window.showDirectoryPicker) {
      setToast({ type: 'err', msg: 'Use Chrome or Edge for local folder access.' });
      return;
    }
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'timesheet-storage' });
      await connectDirectory(handle, true);
    } catch {
      // User canceled picker.
    }
  }

  async function reconnectFolder() {
    const saved = await getSavedDirHandle();
    if (!saved) {
      setToast({ type: 'err', msg: 'No saved folder found.' });
      return;
    }
    await connectDirectory(saved, true);
  }

  async function runBusy(task: () => Promise<void>) {
    if (busy) return;
    const startedAt = Date.now();
    setBusy(true);
    try {
      await task();
    } finally {
      const elapsed = Date.now() - startedAt;
      const minVisible = 500;
      if (elapsed < minVisible) {
        await new Promise((resolve) => setTimeout(resolve, minVisible - elapsed));
      }
      setBusy(false);
    }
  }

  async function persist(next: TimesheetDB) {
    if (!dirHandle) return;
    await writeTimesheetDB(dirHandle, next);
    setDb(next);
  }

  async function clockToggle(employee: Employee) {
    if (!db) return;
    const nextStatus: Employee['status'] = employee.status === 'in' ? 'out' : 'in';
    const nowIso = new Date().toISOString();
    const updatedEmployees = db.employees.map((e) =>
      e.id === employee.id ? { ...e, status: nextStatus, last_action: nowIso } : e
    );
    const historyRow: HistoryRow = {
      id: db.meta.nextHistoryId,
      employee_id: employee.id,
      employee_name: employee.name,
      employee_role: employee.role,
      action: nextStatus === 'in' ? 'clock_in' : 'clock_out',
      timestamp: nowIso,
      created_at: nowIso,
    };
    const next: TimesheetDB = {
      ...db,
      employees: updatedEmployees,
      history: [historyRow, ...db.history],
      meta: { ...db.meta, nextHistoryId: db.meta.nextHistoryId + 1 },
    };
    await persist(next);
    setToast({ type: 'ok', msg: `${employee.name} ${formatAction(historyRow.action)}.` });
  }

  async function submitAdminLogin() {
    if (!db) return;
    const expected = getSetting(db, 'adminPasswordHash', 'MTIzNA==');
    if (hashPin(adminPasswordInput) === expected) {
      setAdminPasswordInput('');
      setScreen('admin');
      setAdminTab('dashboard');
      return;
    }
    setToast({ type: 'err', msg: 'Invalid admin password.' });
  }

  function openAddEmployee() {
    setEditingEmployeeId(null);
    setEmployeeForm({
      name: '',
      role: 'Online',
      gender: 'Male',
      mobile: '',
      email: '',
      photo: '',
      off_days: ['Sun'],
      display_order: String(db?.employees.length ? db.employees.length + 1 : 1),
      pin: '',
      active: true,
    });
    setEmployeeModalOpen(true);
  }

  function openEditEmployee(employee: Employee) {
    setEditingEmployeeId(employee.id);
    setEmployeeForm({
      name: employee.name,
      role: employee.role,
      gender: employee.gender ?? 'Male',
      mobile: employee.mobile ?? '',
      email: employee.email ?? '',
      photo: employee.photo ?? '',
      off_days: employee.off_days,
      display_order: String(employee.display_order ?? ''),
      pin: '',
      active: employee.active,
    });
    setEmployeeModalOpen(true);
  }

  async function saveEmployee() {
    if (!db) return;
    if (!employeeForm.name.trim() || !employeeForm.role.trim()) {
      setToast({ type: 'err', msg: 'Name and role are required.' });
      return;
    }
    if (employeeForm.pin && !/^\d{4}$/.test(employeeForm.pin)) {
      setToast({ type: 'err', msg: 'PIN must be exactly 4 digits.' });
      return;
    }
    const offDays = employeeForm.off_days;
    const displayOrder = Number(employeeForm.display_order) || db.employees.length + 1;
    if (editingEmployeeId) {
      const updated = db.employees.map((e) =>
        e.id === editingEmployeeId
          ? {
              ...e,
              name: employeeForm.name.trim(),
              role: employeeForm.role.trim(),
              gender: employeeForm.gender,
              mobile: employeeForm.mobile.trim(),
              email: employeeForm.email.trim(),
              photo: employeeForm.photo.trim() || undefined,
              off_days: offDays,
              display_order: displayOrder,
              active: employeeForm.active,
              pin_hash: employeeForm.pin ? hashPin(employeeForm.pin) : e.pin_hash,
            }
          : e
      );
      await persist({ ...db, employees: updated });
      setToast({ type: 'ok', msg: 'Employee updated.' });
    } else {
      const nextId = Math.max(100, ...db.employees.map((e) => e.id)) + 1;
      const added: Employee = {
        id: nextId,
        name: employeeForm.name.trim(),
        role: employeeForm.role.trim(),
        gender: employeeForm.gender,
        mobile: employeeForm.mobile.trim(),
        email: employeeForm.email.trim(),
        photo: employeeForm.photo.trim() || undefined,
        off_days: offDays,
        status: 'out',
        last_action: null,
        active: employeeForm.active,
        display_order: displayOrder,
        pin_hash: employeeForm.pin ? hashPin(employeeForm.pin) : undefined,
      };
      await persist({ ...db, employees: [...db.employees, added] });
      setToast({ type: 'ok', msg: 'Employee added.' });
    }
    setEmployeeModalOpen(false);
  }

  async function deleteEmployee(employeeId: number) {
    if (!db) return;
    const filtered = db.employees.filter((e) => e.id !== employeeId);
    await persist({ ...db, employees: filtered });
    setToast({ type: 'ok', msg: 'Employee removed.' });
  }

  function toggleOffDay(day: string) {
    setEmployeeForm((prev) => ({
      ...prev,
      off_days: prev.off_days.includes(day)
        ? prev.off_days.filter((d) => d !== day)
        : [...prev.off_days, day],
    }));
  }

  async function onPhotoSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setEmployeeForm((prev) => ({ ...prev, photo: dataUrl }));
  }

  function setRandomPhoto() {
    setEmployeeForm((prev) => ({ ...prev, photo: makeAvatarDataUrl(prev.name || 'Employee', prev.gender) }));
  }

  function downloadEmployeeTemplate() {
    const header = 'id,name,role,gender,mobile,email,photo,off_days,status,last_action,active,display_order,pin_hash';
    const sample = '201,Sample Employee,Online,Male,5551000,sample@local.company,,Sun|Sat,out,,true,1,';
    const blob = new Blob([`${header}\n${sample}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'employees_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportEmployeesCsv() {
    if (!db) return;
    const rows = db.employees.map((e) =>
      [
        e.id,
        e.name,
        e.role,
        e.gender ?? '',
        e.mobile ?? '',
        e.email ?? '',
        e.photo ?? '',
        e.off_days.join('|'),
        e.status,
        e.last_action ?? '',
        e.active,
        e.display_order,
        e.pin_hash ?? '',
      ]
        .map((v) => `"${String(v).split('"').join('""')}"`)
        .join(',')
    );
    const csv = [
      'id,name,role,gender,mobile,email,photo,off_days,status,last_action,active,display_order,pin_hash',
      ...rows,
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'employees_export.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function onImportEmployees(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !db) return;
    await runBusy(async () => {
      const text = await file.text();
      let imported: Employee[] = [];
      if (file.name.toLowerCase().endsWith('.json')) {
        const parsed = JSON.parse(text) as Employee[];
        imported = parsed;
      } else {
        const lines = text.split(/\r?\n/).filter(Boolean);
        const [, ...dataLines] = lines;
        imported = dataLines.map((line, idx) => {
          const cols = line.split(',').map((c) => c.replace(/^"|"$/g, ''));
          return {
            id: Number(cols[0]) || 1000 + idx,
            name: cols[1] || 'Employee',
            role: cols[2] || 'Online',
            gender: cols[3] || 'Male',
            mobile: cols[4] || '',
            email: cols[5] || '',
            photo: cols[6] || '',
            off_days: (cols[7] || 'Sun').split('|').filter(Boolean),
            status: (cols[8] as Employee['status']) || 'out',
            last_action: cols[9] || null,
            active: cols[10] !== 'false',
            display_order: Number(cols[11]) || idx + 1,
            pin_hash: cols[12] || undefined,
          };
        });
      }
      if (!imported.length) {
        setToast({ type: 'err', msg: 'No employees found in imported file.' });
        return;
      }
      await persist({ ...db, employees: imported });
      setToast({ type: 'ok', msg: `Imported ${imported.length} employees.` });
      event.target.value = '';
    });
  }

  const reportRows = useMemo(() => {
    if (!db) return [];
    const start = new Date(reportStart);
    const end = new Date(reportEnd);
    end.setHours(23, 59, 59, 999);
    return db.history.filter((row) => {
      const ts = new Date(row.timestamp);
      if (ts < start || ts > end) return false;
      if (reportEmployeeId === 'all') return true;
      return row.employee_id === reportEmployeeId;
    });
  }, [db, reportEmployeeId, reportStart, reportEnd]);

  const reportHours = useMemo(() => totalHoursFromHistory(reportRows), [reportRows]);

  function exportCsv(rows: HistoryRow[], filename: string) {
    const csv = [
      'id,employee_name,employee_role,action,timestamp',
      ...rows.map((r) =>
        [r.id, r.employee_name, r.employee_role, formatAction(r.action), new Date(r.timestamp).toLocaleString()]
          .map((v) => `"${String(v).split('"').join('""')}"`)
          .join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveSettingsBundle(overrides?: Record<string, unknown>) {
    if (!db) return;
    const next: TimesheetDB = {
      ...db,
      app_settings: {
        ...db.app_settings,
        theme,
        pinVerificationEnabled,
        locationSettings: {
          radius,
          storeIP,
          latitude,
          longitude,
          gpsEnabled,
          ipEnabled,
        },
        cameraVerificationEnabled,
        branding: {
          name: brandingName,
          tagline: brandingTagline,
          logo: brandingLogo,
          phone: brandingPhone,
          email: brandingEmail,
          address: brandingAddress,
        },
        ...(overrides ?? {}),
      },
    };
    await persist(next);
    setToast({ type: 'ok', msg: 'Settings saved.' });
  }

  function downloadJson(data: unknown, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function onCompanyLogoSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setBrandingLogo(dataUrl);
    event.target.value = '';
  }

  function downloadLatestBackup() {
    if (!db?.backups.length) {
      setToast({ type: 'err', msg: 'No backups available.' });
      return;
    }
    const latest = db.backups[0];
    downloadJson(latest.data, `timesheet_backup_${latest.id}.json`);
  }

  function downloadCurrentDatabase() {
    if (!db) return;
    downloadJson(db, 'timesheet_database_download.json');
  }

  async function updateAdminPassword() {
    if (!db) return;
    const expected = getSetting(db, 'adminPasswordHash', 'MTIzNA==');
    if (hashPin(oldPassword) !== expected) {
      setToast({ type: 'err', msg: 'Old password is incorrect.' });
      return;
    }
    if (!/^\d{4}$/.test(newPassword)) {
      setToast({ type: 'err', msg: 'New password must be exactly 4 digits.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast({ type: 'err', msg: 'Password confirmation does not match.' });
      return;
    }
    await saveSettingsBundle({ adminPasswordHash: hashPin(newPassword) });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setToast({ type: 'ok', msg: 'Admin password updated.' });
  }

  async function createBackup() {
    if (!db) return;
    const backup = {
      id: db.meta.nextBackupId,
      created_at: new Date().toISOString(),
      data: db,
    };
    const next: TimesheetDB = {
      ...db,
      backups: [backup, ...db.backups],
      meta: { ...db.meta, nextBackupId: db.meta.nextBackupId + 1 },
    };
    await persist(next);
    setToast({ type: 'ok', msg: 'Backup created in local database file.' });
  }

  async function clearHistory() {
    if (!db) return;
    const nextEmployees = db.employees.map((e) => ({ ...e, status: 'out' as const, last_action: null }));
    await persist({ ...db, employees: nextEmployees, history: [] });
    setToast({ type: 'ok', msg: 'History cleaned.' });
  }

  async function disconnectFolder() {
    await clearDirHandle();
    setDirHandle(null);
    setDirName('');
    setDb(null);
    setHasSavedHandle(false);
    setScreen('home');
  }

  const companyName = brandingName || 'Rajani Superstore';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {busy && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45">
          <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm">
            <LoaderCircle className="h-5 w-5 animate-spin text-indigo-300" />
            <span>Please wait...</span>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed right-4 top-4 z-50">
          <div className={`rounded-lg border px-4 py-2 text-sm ${toast.type === 'ok' ? 'border-emerald-400/30 bg-emerald-500/20' : 'border-red-400/30 bg-red-500/20'}`}>
            {toast.msg}
          </div>
        </div>
      )}

      {screen === 'home' && (
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#1e3a8a_0,#0f172a_45%,#020617_100%)] px-6">
          <div className="absolute left-6 top-6 flex items-center gap-2">
            <button
              onClick={() => void runBusy(browseFolder)}
              className="rounded-md bg-slate-800/90 px-3 py-2 text-xs text-slate-100 hover:bg-slate-700"
              title="Change storage folder"
            >
              <FolderOpen className="mr-1 inline h-4 w-4" />{dirName ? 'Change Folder' : 'Set Folder'}
            </button>
            {hasSavedHandle && !db && (
              <button onClick={() => void runBusy(reconnectFolder)} className="rounded-md bg-slate-800/90 px-3 py-2 text-xs hover:bg-slate-700">
                <RefreshCw className="mr-1 inline h-4 w-4" />Reconnect
              </button>
            )}
          </div>
          <div className="absolute right-6 top-6 rounded-md bg-slate-800/80 px-4 py-2 text-sm text-slate-200">{currentTime}</div>
          <div className="w-full max-w-3xl text-center">
            {brandingLogo ? (
              <img
                src={brandingLogo}
                alt="Company logo"
                className="mx-auto mb-4 h-16 w-16 rounded-xl object-cover"
              />
            ) : null}
            <h1 className="text-5xl font-bold tracking-tight text-indigo-300">{companyName}</h1>
            <p className="mt-2 text-slate-300">Employee Timesheet - Local Storage Mode</p>
            <p className="mt-1 text-xs text-slate-400">{dirName ? `Storage: ${dirName}` : 'Storage not connected'}</p>

            <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
              <button
                disabled={!db}
                onClick={() => setScreen('employee-list')}
                className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-left transition hover:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <BookUser className="mb-3 h-8 w-8 text-indigo-300" />
                <h2 className="text-2xl font-semibold">Employee Portal</h2>
                <p className="mt-1 text-slate-300">Clock in and clock out</p>
              </button>
              <button
                disabled={!db}
                onClick={() => setScreen('admin-login')}
                className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-left transition hover:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Shield className="mb-3 h-8 w-8 text-indigo-300" />
                <h2 className="text-2xl font-semibold">Admin Console</h2>
                <p className="mt-1 text-slate-300">Manage employees and reports</p>
              </button>
            </div>
          </div>
        </section>
      )}

      {screen === 'employee-list' && db && (
        <section className="min-h-screen bg-[linear-gradient(90deg,#0a1440_0%,#111f44_45%,#1e2d49_100%)]">
          <div className="border-b border-slate-700/60 bg-[#070f2f] px-6 py-5">
            <div className="mx-auto grid max-w-5xl items-start gap-3 md:grid-cols-[1fr_auto_1fr]">
              <div>
                <button onClick={() => setScreen('home')} className="inline-flex items-center text-slate-300 hover:text-white">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                </button>
              </div>
              <div className="text-center">
                <h2 className="text-5xl font-bold leading-none md:text-4xl">Choose your profile</h2>
                <p className="mt-1 text-slate-400">Tap your name to clock in / out</p>
                <div className="relative mt-4 w-[430px] max-w-[90vw]">
                  <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/70 py-2.5 pl-10 pr-3 text-base outline-none focus:border-indigo-400"
                    placeholder="Search by name or role..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <div className="space-y-1 text-xs">
                  <div className="flex min-w-20 items-center justify-between rounded-md bg-emerald-500/20 px-2 py-1 text-emerald-300">
                    <span>IN</span>
                    <span className="font-semibold">{inCount}</span>
                  </div>
                  <div className="flex min-w-20 items-center justify-between rounded-md bg-slate-500/20 px-2 py-1 text-slate-200">
                    <span>OUT</span>
                    <span className="font-semibold">{outCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-5xl px-6 py-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleEmployees.map((employee) => {
                const effectiveStatus = employee.status === 'out' && isOffDay(employee, new Date()) ? 'off' : employee.status;
                return (
                  <button
                    key={employee.id}
                    onClick={() => {
                      setSelectedEmployeeId(employee.id);
                      setScreen('employee-detail');
                    }}
                    className="rounded-2xl border border-slate-700/80 bg-slate-800/30 px-6 py-7 text-center transition hover:border-indigo-400/70"
                  >
                    <div className="relative mx-auto mb-4 h-24 w-24">
                      <img
                        src={employee.photo || makeAvatarDataUrl(employee.name, employee.gender ?? 'Male')}
                        alt={employee.name}
                        className="h-24 w-24 rounded-full object-cover"
                      />
                      <span className={`absolute bottom-0 right-0 h-5 w-5 rounded-full border-2 border-slate-800 ${effectiveStatus === 'in' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    </div>
                    <h3 className="text-3xl font-bold leading-tight md:text-[34px]">{employee.name}</h3>
                    <p className="mt-1 text-slate-400">{employee.role}</p>
                    <span className={`mt-3 inline-block rounded-full px-4 py-1 text-sm ${badgeClass(effectiveStatus)}`}>
                      {effectiveStatus === 'in' ? 'Clocked In' : effectiveStatus === 'off' ? 'OFF' : 'Clocked Out'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {screen === 'employee-detail' && selectedEmployee && (
        <section className="min-h-screen bg-[radial-gradient(circle_at_50%_30%,#1e3a8a_0,#16233f_45%,#101a35_100%)] px-6 py-6">
          <button onClick={() => setScreen('employee-list')} className="text-slate-300 hover:text-white">
            <ArrowLeft className="mr-2 inline h-4 w-4" />Back to Profiles
          </button>

          <div className="mx-auto mt-14 w-full max-w-md rounded-3xl border border-slate-600/40 bg-slate-800/35 p-6 text-center">
            <div className="relative mx-auto mb-5 h-28 w-28">
              <img
                src={selectedEmployee.photo || makeAvatarDataUrl(selectedEmployee.name, selectedEmployee.gender ?? 'Male')}
                alt={selectedEmployee.name}
                className="h-28 w-28 rounded-full border-4 border-indigo-500 object-cover"
              />
              <span className={`absolute bottom-1 right-1 h-6 w-6 rounded-full border-4 border-slate-800 ${selectedEmployee.status === 'in' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            </div>

            <h2 className="text-4xl font-bold leading-tight">{selectedEmployee.name}</h2>
            <p className="mt-1 text-slate-400">{selectedEmployee.role}</p>

            <div className="mt-6 rounded-2xl border border-slate-600/60 bg-slate-700/35 p-4 text-left text-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-slate-300">Status</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(selectedEmployee.status)}`}>
                  {selectedEmployee.status === 'in' ? 'Clocked In' : 'Clocked Out'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-300">Last Activity</span>
                <span className="text-right text-white">
                  {selectedEmployee.last_action
                    ? new Date(selectedEmployee.last_action).toLocaleString([], {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'No records'}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-600/60 bg-slate-700/35 p-4 text-left">
              <p className="mb-3 text-sm font-semibold text-slate-300">Today's Clock Records</p>
              <div className="space-y-2">
                {selectedEmployeeTodayHistory.length === 0 ? (
                  <div className="rounded-md bg-slate-600/30 px-3 py-2 text-sm text-slate-300">No records for today</div>
                ) : (
                  selectedEmployeeTodayHistory.map((row) => (
                    <div key={row.id} className="flex items-center justify-between rounded-md bg-slate-600/30 px-3 py-2 text-sm">
                      <span className="text-slate-300">{row.action === 'clock_in' ? 'Clocked In' : 'Clocked Out'}</span>
                      <span className="font-semibold text-white">
                        {new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => void runBusy(async () => { await clockToggle(selectedEmployee); })}
              className={`mt-6 w-full rounded-xl px-4 py-3 text-3xl font-semibold ${selectedEmployee.status === 'in' ? 'bg-red-500 hover:bg-red-400' : 'bg-emerald-500 hover:bg-emerald-400'}`}
            >
              {selectedEmployee.status === 'in' ? 'Clock Out' : 'Clock In'}
            </button>

            <div className="mt-6 text-slate-400">
              <Clock3 className="mr-2 inline h-4 w-4" />
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </section>
      )}

      {screen === 'admin-login' && db && (
        <section className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_40%_20%,#1d4ed8_0,#0f172a_50%,#020617_100%)] px-6">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900/70 p-6">
            <h2 className="mb-1 text-2xl font-bold">Admin Access</h2>
            <p className="mb-5 text-slate-300">Enter admin password</p>
            <label className="mb-2 block text-sm text-slate-300">Password</label>
            <input
              type="password"
              value={adminPasswordInput}
              onChange={(e) => setAdminPasswordInput(e.target.value)}
              className="mb-4 w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 outline-none focus:border-indigo-400"
            />
            <button onClick={() => void runBusy(submitAdminLogin)} className="mb-3 w-full rounded-md bg-indigo-600 py-2 font-semibold hover:bg-indigo-500">
              <Lock className="mr-2 inline h-4 w-4" />Login
            </button>
            <button onClick={() => setScreen('home')} className="w-full rounded-md bg-slate-700 py-2 text-slate-200 hover:bg-slate-600">
              Cancel
            </button>
          </div>
        </section>
      )}

      {screen === 'admin' && db && (
        <section className="flex min-h-screen bg-[radial-gradient(circle_at_30%_20%,#1e3a8a_0,#0f172a_50%,#020617_100%)]">
          <aside className="flex h-screen w-72 flex-col border-r border-slate-800 bg-slate-950/80 p-5">
            {brandingLogo ? (
              <img
                src={brandingLogo}
                alt="Company logo"
                className="mb-3 h-12 w-12 rounded-lg object-cover"
              />
            ) : null}
            <h2 className="text-2xl font-bold">{companyName}</h2>
            <p className="mb-6 text-sm text-slate-300">{brandingTagline || 'Time Management'}</p>
            <div className="space-y-2">
              {([
                ['dashboard', 'Dashboard'],
                ['employees', 'Employees'],
                ['reports', 'Reports'],
                ['settings', 'Settings'],
                ['clean', 'Clean Data'],
              ] as [AdminTab, string][]).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setAdminTab(tab)}
                  className={`block w-full rounded-md px-3 py-2 text-left ${adminTab === tab ? 'bg-indigo-600/30 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-auto space-y-2 pt-6">
              <button onClick={() => setScreen('home')} className="w-full rounded-md bg-slate-800 px-3 py-2 text-left text-red-300 hover:bg-slate-700">
                <LogOut className="mr-2 inline h-4 w-4" />Logout
              </button>
              <button onClick={() => void runBusy(disconnectFolder)} className="w-full rounded-md bg-slate-800 px-3 py-2 text-left text-slate-300 hover:bg-slate-700">
                <Database className="mr-2 inline h-4 w-4" />Disconnect Folder
              </button>
            </div>
          </aside>

          <main className="flex-1 p-8">
            {adminTab === 'dashboard' && (
              <div>
                <h3 className="mb-5 text-4xl font-bold">Dashboard</h3>
                <div className="mb-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                    <div className="text-slate-300">Total Staff</div>
                    <div className="mt-2 text-4xl font-bold">{employees.length}</div>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                    <div className="text-slate-300">Clocked In</div>
                    <div className="mt-2 text-4xl font-bold text-emerald-300">{inCount}</div>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                    <div className="text-slate-300">Today's Activity</div>
                    <div className="mt-2 text-4xl font-bold text-amber-300">
                      {db.history.filter((h) => new Date(h.timestamp).toDateString() === new Date().toDateString()).length}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-900/50">
                  <div className="border-b border-slate-700 px-4 py-3 text-xl font-semibold">Recent Activity</div>
                  <table className="w-full text-left text-sm">
                    <thead className="text-slate-300">
                      <tr>
                        <th className="px-4 py-2">Employee</th>
                        <th className="px-4 py-2">Action</th>
                        <th className="px-4 py-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {db.history.slice(0, 8).map((h) => (
                        <tr key={h.id} className="border-t border-slate-800">
                          <td className="px-4 py-2">{h.employee_name}</td>
                          <td className="px-4 py-2">{formatAction(h.action)}</td>
                          <td className="px-4 py-2">{new Date(h.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {adminTab === 'employees' && (
              <div>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-4xl font-bold">Employees</h3>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        value={adminEmployeeSearch}
                        onChange={(e) => {
                          setAdminEmployeeSearch(e.target.value);
                          setEmployeePage(1);
                        }}
                        placeholder="Search..."
                        className="rounded-md border border-slate-700 bg-slate-900/60 py-2 pl-9 pr-3 text-sm"
                      />
                    </div>
                    <button onClick={openAddEmployee} className="rounded-md bg-indigo-600 px-4 py-2 hover:bg-indigo-500">
                      <Plus className="mr-2 inline h-4 w-4" />Add Employee
                    </button>
                    <button onClick={downloadEmployeeTemplate} className="rounded-md bg-slate-700 px-4 py-2 hover:bg-slate-600">
                      <FileDown className="mr-2 inline h-4 w-4" />Template
                    </button>
                    <button onClick={() => importInputRef.current?.click()} className="rounded-md bg-slate-700 px-4 py-2 hover:bg-slate-600">
                      <FileUp className="mr-2 inline h-4 w-4" />Import
                    </button>
                    <button onClick={exportEmployeesCsv} className="rounded-md bg-slate-700 px-4 py-2 hover:bg-slate-600">
                      <Download className="mr-2 inline h-4 w-4" />Export
                    </button>
                    <input
                      ref={importInputRef}
                      type="file"
                      accept=".json,.csv"
                      className="hidden"
                      onChange={(e) => void onImportEmployees(e)}
                    />
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/50">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800/60 text-slate-300">
                      <tr>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">Off Days</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedEmployees.map((e) => (
                        <tr key={e.id} className="border-t border-slate-800 text-sm">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={e.photo || makeAvatarDataUrl(e.name, e.gender ?? 'Male')}
                                alt={e.name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                              <span className="font-semibold">{e.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">{e.role}</td>
                          <td className="px-4 py-3">{e.mobile || '-'} {e.email ? `| ${e.email}` : ''}</td>
                          <td className="px-4 py-3">{e.off_days.join(', ') || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded px-3 py-1 text-xs ${e.active ? badgeClass(e.status) : 'bg-slate-700 text-slate-300'}`}>
                              {e.active ? e.status.toUpperCase() : 'INACTIVE'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => openEditEmployee(e)} className="mr-2 rounded bg-slate-700 px-2 py-1 hover:bg-slate-600">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => void runBusy(async () => { await deleteEmployee(e.id); })} className="rounded bg-red-500/70 px-2 py-1 hover:bg-red-500">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between border-t border-slate-700 px-4 py-3 text-sm text-slate-300">
                    <span>
                      Showing {adminEmployees.length ? (employeePage - 1) * pageSize + 1 : 0}-{Math.min(employeePage * pageSize, adminEmployees.length)} of {adminEmployees.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEmployeePage((p) => Math.max(1, p - 1))}
                        disabled={employeePage <= 1}
                        className="rounded bg-slate-700 px-3 py-1 disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <span>{employeePage} / {totalEmployeePages}</span>
                      <button
                        onClick={() => setEmployeePage((p) => Math.min(totalEmployeePages, p + 1))}
                        disabled={employeePage >= totalEmployeePages}
                        className="rounded bg-slate-700 px-3 py-1 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {adminTab === 'reports' && (
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-4xl font-bold">Custom Report</h3>
                  <button onClick={() => exportCsv(reportRows, 'report.csv')} className="rounded-md bg-slate-700 px-4 py-2 hover:bg-slate-600">
                    <Download className="mr-2 inline h-4 w-4" />Export CSV
                  </button>
                </div>
                <div className="mb-4 grid gap-3 md:grid-cols-3">
                  <select
                    value={reportEmployeeId}
                    onChange={(e) => setReportEmployeeId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2"
                  >
                    <option value="all">All Employees</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                  <input value={reportStart} onChange={(e) => setReportStart(e.target.value)} type="date" className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2" />
                  <input value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} type="date" className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2" />
                </div>
                <div className="mb-3 text-slate-300">Total computed hours: <span className="font-bold text-emerald-300">{reportHours}</span></div>

                <div className="rounded-xl border border-slate-700 bg-slate-900/50">
                  <table className="w-full text-left text-sm">
                    <thead className="text-slate-300">
                      <tr>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportRows.map((row) => (
                        <tr key={row.id} className="border-t border-slate-800">
                          <td className="px-4 py-2">{row.employee_name}</td>
                          <td className="px-4 py-2">{formatAction(row.action)}</td>
                          <td className="px-4 py-2">{new Date(row.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {adminTab === 'settings' && (
              <div>
                <h3 className="mb-5 text-4xl font-bold">Settings</h3>
                <div className="max-w-4xl space-y-3">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/50">
                    <button onClick={() => setExpandedSetting((p) => (p === 'accent' ? '' : 'accent'))} className="flex w-full items-center justify-between px-4 py-3 text-left">
                      <span className="font-semibold"><Palette className="mr-2 inline h-4 w-4 text-indigo-300" />Accent Color</span>
                      <ChevronDown className={`h-4 w-4 transition ${expandedSetting === 'accent' ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedSetting === 'accent' && (
                      <div className="grid grid-cols-4 gap-2 border-t border-slate-700 p-4">
                        {['blue', 'green', 'pink', 'orange'].map((c) => (
                          <button key={c} onClick={() => setTheme(c)} className={`h-10 rounded-md ${c === 'blue' ? 'bg-gradient-to-r from-indigo-500 to-blue-500' : c === 'green' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : c === 'pink' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-orange-500 to-red-500'}`}>
                            {theme === c ? '✓' : ''}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-900/50">
                    <button onClick={() => setExpandedSetting((p) => (p === 'branding' ? '' : 'branding'))} className="flex w-full items-center justify-between px-4 py-3 text-left">
                      <span className="font-semibold"><Building2 className="mr-2 inline h-4 w-4 text-indigo-300" />Company Branding</span>
                      <ChevronDown className={`h-4 w-4 transition ${expandedSetting === 'branding' ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedSetting === 'branding' && (
                      <div className="space-y-3 border-t border-slate-700 p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input value={brandingName} onChange={(e) => setBrandingName(e.target.value)} placeholder="Company Name" className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2" />
                          <input value={brandingTagline} onChange={(e) => setBrandingTagline(e.target.value)} placeholder="Tagline" className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2" />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input value={brandingPhone} onChange={(e) => setBrandingPhone(e.target.value)} placeholder="Company Phone" className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2" />
                          <input value={brandingEmail} onChange={(e) => setBrandingEmail(e.target.value)} placeholder="Company Email" className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2" />
                        </div>
                        <input value={brandingAddress} onChange={(e) => setBrandingAddress(e.target.value)} placeholder="Company Address" className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2" />
                        <div className="flex flex-wrap items-center gap-3">
                          <img
                            src={brandingLogo || makeAvatarDataUrl(brandingName || 'Company', 'Brand')}
                            alt="Logo preview"
                            className="h-14 w-14 rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => companyLogoInputRef.current?.click()}
                            className="rounded-md bg-slate-700 px-3 py-2 hover:bg-slate-600"
                          >
                            <Upload className="mr-2 inline h-4 w-4" />Upload Logo
                          </button>
                          <button
                            type="button"
                            onClick={() => setBrandingLogo('')}
                            className="rounded-md bg-slate-700 px-3 py-2 hover:bg-slate-600"
                          >
                            Remove
                          </button>
                          <input
                            ref={companyLogoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => void onCompanyLogoSelected(e)}
                          />
                        </div>
                        <button onClick={() => void runBusy(async () => { await saveSettingsBundle(); })} className="rounded-md bg-indigo-600 px-4 py-2 hover:bg-indigo-500">Save Branding</button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-900/50">
                    <button onClick={() => setExpandedSetting((p) => (p === 'gps' ? '' : 'gps'))} className="flex w-full items-center justify-between px-4 py-3 text-left">
                      <span className="font-semibold"><MapPin className="mr-2 inline h-4 w-4 text-indigo-300" />Location Restriction (GPS)</span>
                      <span className="rounded bg-slate-700 px-2 py-0.5 text-xs">{gpsEnabled ? 'Enabled' : 'Disabled'}</span>
                    </button>
                    {expandedSetting === 'gps' && (
                      <div className="space-y-3 border-t border-slate-700 p-4">
                        <label className="flex items-center justify-between rounded-md bg-slate-800/60 px-3 py-2">
                          <span>Enable GPS Restriction</span>
                          <input type="checkbox" checked={gpsEnabled} onChange={(e) => setGpsEnabled(e.target.checked)} />
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Latitude" className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2" />
                          <input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Longitude" className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2" />
                        </div>
                        <input type="number" value={radius} onChange={(e) => setRadius(Number(e.target.value || 0))} placeholder="Radius" className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2" />
                        <button onClick={() => void runBusy(async () => { await saveSettingsBundle(); })} className="rounded-md bg-indigo-600 px-4 py-2 hover:bg-indigo-500">Save GPS Settings</button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-900/50">
                    <button onClick={() => setExpandedSetting((p) => (p === 'ip' ? '' : 'ip'))} className="flex w-full items-center justify-between px-4 py-3 text-left">
                      <span className="font-semibold"><Network className="mr-2 inline h-4 w-4 text-indigo-300" />Network Restriction (IP)</span>
                      <span className="rounded bg-slate-700 px-2 py-0.5 text-xs">{ipEnabled ? 'Enabled' : 'Disabled'}</span>
                    </button>
                    {expandedSetting === 'ip' && (
                      <div className="space-y-3 border-t border-slate-700 p-4">
                        <label className="flex items-center justify-between rounded-md bg-slate-800/60 px-3 py-2">
                          <span>Enable IP Restriction</span>
                          <input type="checkbox" checked={ipEnabled} onChange={(e) => setIpEnabled(e.target.checked)} />
                        </label>
                        <input value={storeIP} onChange={(e) => setStoreIP(e.target.value)} placeholder="Allowed Store IP" className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2" />
                        <button onClick={() => void runBusy(async () => { await saveSettingsBundle(); })} className="rounded-md bg-indigo-600 px-4 py-2 hover:bg-indigo-500">Save IP Settings</button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-900/50">
                    <button onClick={() => setExpandedSetting((p) => (p === 'verification' ? '' : 'verification'))} className="flex w-full items-center justify-between px-4 py-3 text-left">
                      <span className="font-semibold"><Camera className="mr-2 inline h-4 w-4 text-indigo-300" />Clock-In Verification</span>
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">{cameraVerificationEnabled ? 'Camera Only' : 'Standard'}</span>
                    </button>
                    {expandedSetting === 'verification' && (
                      <div className="space-y-3 border-t border-slate-700 p-4">
                        <label className="flex items-center justify-between rounded-md bg-slate-800/60 px-3 py-2">
                          <span>Employee PIN Verification</span>
                          <input type="checkbox" checked={pinVerificationEnabled} onChange={(e) => setPinVerificationEnabled(e.target.checked)} />
                        </label>
                        <label className="flex items-center justify-between rounded-md bg-slate-800/60 px-3 py-2">
                          <span>Camera Capture</span>
                          <input type="checkbox" checked={cameraVerificationEnabled} onChange={(e) => setCameraVerificationEnabled(e.target.checked)} />
                        </label>
                        <button onClick={() => void runBusy(async () => { await saveSettingsBundle(); })} className="rounded-md bg-indigo-600 px-4 py-2 hover:bg-indigo-500">Save Verification Settings</button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-900/50">
                    <button onClick={() => setExpandedSetting((p) => (p === 'directory' ? '' : 'directory'))} className="flex w-full items-center justify-between px-4 py-3 text-left">
                      <span className="font-semibold"><HardDrive className="mr-2 inline h-4 w-4 text-indigo-300" />Database Directory Setup</span>
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-200">Connected</span>
                    </button>
                    {expandedSetting === 'directory' && (
                      <div className="space-y-3 border-t border-slate-700 p-4">
                        <p className="text-sm text-slate-300">Current directory: <span className="font-semibold text-white">{dirName}</span></p>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => void runBusy(createBackup)} className="rounded-md bg-slate-700 px-3 py-2 hover:bg-slate-600">Create Backup</button>
                          <button onClick={downloadLatestBackup} className="rounded-md bg-slate-700 px-3 py-2 hover:bg-slate-600">Download Latest Backup</button>
                          <button onClick={downloadCurrentDatabase} className="rounded-md bg-indigo-600 px-3 py-2 hover:bg-indigo-500">Download Current Database</button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-900/50">
                    <button onClick={() => setExpandedSetting((p) => (p === 'password' ? '' : 'password'))} className="flex w-full items-center justify-between px-4 py-3 text-left">
                      <span className="font-semibold"><LockKeyhole className="mr-2 inline h-4 w-4 text-indigo-300" />Reset Password</span>
                      <ChevronDown className={`h-4 w-4 transition ${expandedSetting === 'password' ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedSetting === 'password' && (
                      <div className="space-y-3 border-t border-slate-700 p-4">
                        <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Old Password (4-digit)" className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2" />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2" />
                          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2" />
                        </div>
                        <button onClick={() => void runBusy(updateAdminPassword)} className="rounded-md bg-indigo-600 px-4 py-2 hover:bg-indigo-500">Update Password</button>
                        <p className="text-xs text-slate-400">Password must be exactly 4 digits.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {adminTab === 'clean' && (
              <div>
                <h3 className="mb-5 text-4xl font-bold">Clean Data</h3>
                <div className="max-w-2xl space-y-3 rounded-xl border border-slate-700 bg-slate-900/50 p-5">
                  <p className="text-slate-300">Backups in database: {db.backups.length}</p>
                  <button onClick={() => void runBusy(createBackup)} className="rounded-md bg-slate-700 px-4 py-2 hover:bg-slate-600">
                    <Database className="mr-2 inline h-4 w-4" />Create Backup
                  </button>
                  <button onClick={() => void runBusy(clearHistory)} className="rounded-md bg-red-500/80 px-4 py-2 hover:bg-red-500">
                    <Trash2 className="mr-2 inline h-4 w-4" />Clear All History
                  </button>
                </div>
              </div>
            )}
          </main>
        </section>
      )}

      {employeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-xl rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h4 className="mb-4 text-2xl font-semibold">{editingEmployeeId ? 'Edit Employee' : 'Add Employee'}</h4>
            <div className="space-y-3 text-sm">
              <div>
                <label className="mb-1 block text-slate-300">Full Name *</label>
                <input placeholder="Full Name" value={employeeForm.name} onChange={(e) => setEmployeeForm((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-slate-300">Gender</label>
                  <select value={employeeForm.gender} onChange={(e) => setEmployeeForm((p) => ({ ...p, gender: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2">
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-slate-300">Job Role *</label>
                  <select value={employeeForm.role} onChange={(e) => setEmployeeForm((p) => ({ ...p, role: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2">
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-slate-300">Display Order Number (optional)</label>
                <input placeholder="10" value={employeeForm.display_order} onChange={(e) => setEmployeeForm((p) => ({ ...p, display_order: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2" />
              </div>

              <div>
                <label className="mb-1 block text-slate-300">Password (4-digit PIN)</label>
                <div className="relative">
                  <input type={showPin ? 'text' : 'password'} maxLength={4} placeholder="1234" value={employeeForm.pin} onChange={(e) => setEmployeeForm((p) => ({ ...p, pin: e.target.value.replace(/\D/g, '') }))} className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 pr-10" />
                  <button type="button" onClick={() => setShowPin((v) => !v)} className="absolute right-2 top-2 text-slate-300">
                    {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="rounded-md border border-slate-700 bg-slate-800/50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Active Employee</div>
                    <div className="text-xs text-slate-300">Inactive employees won't appear in Employee Portal</div>
                  </div>
                  <button type="button" onClick={() => setEmployeeForm((p) => ({ ...p, active: !p.active }))} className={`h-7 w-12 rounded-full p-1 ${employeeForm.active ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                    <span className={`block h-5 w-5 rounded-full bg-white transition ${employeeForm.active ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-slate-300">Mobile</label>
                  <input placeholder="07767565059" value={employeeForm.mobile} onChange={(e) => setEmployeeForm((p) => ({ ...p, mobile: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2" />
                </div>
                <div>
                  <label className="mb-1 block text-slate-300">Email</label>
                  <input placeholder="employee@mail.com" value={employeeForm.email} onChange={(e) => setEmployeeForm((p) => ({ ...p, email: e.target.value }))} className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-slate-300">Off Days</label>
                <div className="flex flex-wrap gap-3">
                  {dayOptions.map((day) => (
                    <label key={day} className="inline-flex items-center gap-1 text-slate-200">
                      <input type="checkbox" checked={employeeForm.off_days.includes(day)} onChange={() => toggleOffDay(day)} />
                      {day}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-slate-300">Photo (optional)</label>
                <div className="flex items-center gap-3">
                  <img src={employeeForm.photo || makeAvatarDataUrl(employeeForm.name || 'Employee', employeeForm.gender)} alt="preview" className="h-14 w-14 rounded-full object-cover" />
                  <input type="file" accept="image/*" onChange={(e) => void onPhotoSelected(e)} className="hidden" id="employee-photo-input" />
                  <button type="button" onClick={() => document.getElementById('employee-photo-input')?.click()} className="rounded-md bg-slate-700 px-3 py-2 hover:bg-slate-600">
                    <Upload className="mr-2 inline h-4 w-4" />Upload
                  </button>
                  <button type="button" onClick={setRandomPhoto} className="rounded-md bg-slate-700 px-3 py-2 hover:bg-slate-600">Random</button>
                </div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={() => setEmployeeModalOpen(false)} className="rounded-md bg-slate-700 px-4 py-2 hover:bg-slate-600">Cancel</button>
              <button onClick={() => void runBusy(saveEmployee)} className="rounded-md bg-indigo-600 px-4 py-2 hover:bg-indigo-500">Save</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
