import { useEffect, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { format, parseISO, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import type { DiaryEntry } from '../db/localDB';
import {
  Plus,
  Search,
  LogOut,
  BookOpen,
  Calendar,
  Clock,
  Edit3,
  Trash2,
  X,
  Save,
  ChevronDown,
  FileText,
  HardDrive,
  User,
  StickyNote,
  HelpCircle,
} from 'lucide-react';
import GuideModal from './GuideModal';

type ViewMode = 'list' | 'editor';
type FilterPeriod = 'all' | 'today' | 'week' | 'month';

export default function DiaryPage() {
  const {
    currentUser,
    dirName,
    entries,
    loadEntries,
    createEntry,
    editEntry,
    removeEntry,
    logout,
    loading,
    setNotification,
  } = useApp();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [editorData, setEditorData] = useState({ title: '', content: '', date: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const filteredEntries = useMemo(() => {
    let result = entries;

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q)
      );
    }

    // Filter by period
    if (filterPeriod !== 'all') {
      result = result.filter((e) => {
        const d = parseISO(e.date);
        switch (filterPeriod) {
          case 'today': return isToday(d);
          case 'week': return isThisWeek(d, { weekStartsOn: 1 });
          case 'month': return isThisMonth(d);
          default: return true;
        }
      });
    }

    return result;
  }, [entries, searchQuery, filterPeriod]);

  // Group entries by date category
  const groupedEntries = useMemo(() => {
    const groups: { label: string; entries: DiaryEntry[] }[] = [];
    const today: DiaryEntry[] = [];
    const yesterday: DiaryEntry[] = [];
    const thisWeek: DiaryEntry[] = [];
    const older: DiaryEntry[] = [];

    filteredEntries.forEach((e) => {
      const d = parseISO(e.date);
      if (isToday(d)) today.push(e);
      else if (isYesterday(d)) yesterday.push(e);
      else if (isThisWeek(d, { weekStartsOn: 1 })) thisWeek.push(e);
      else older.push(e);
    });

    if (today.length) groups.push({ label: 'Today', entries: today });
    if (yesterday.length) groups.push({ label: 'Yesterday', entries: yesterday });
    if (thisWeek.length) groups.push({ label: 'This Week', entries: thisWeek });
    if (older.length) groups.push({ label: 'Earlier', entries: older });

    return groups;
  }, [filteredEntries]);

  const handleNewEntry = () => {
    setSelectedEntry(null);
    setEditorData({
      title: '',
      content: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    setIsEditing(true);
    setViewMode('editor');
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setSelectedEntry(entry);
    setEditorData({
      title: entry.title,
      content: entry.content,
      date: entry.date,
    });
    setIsEditing(true);
    setViewMode('editor');
  };

  const handleViewEntry = (entry: DiaryEntry) => {
    setSelectedEntry(entry);
    setIsEditing(false);
    setViewMode('editor');
  };

  const handleSave = async () => {
    if (!editorData.title.trim()) {
      setNotification({ type: 'error', message: 'Please enter a title.' });
      return;
    }
    if (!editorData.content.trim()) {
      setNotification({ type: 'error', message: 'Please write something.' });
      return;
    }

    try {
      if (selectedEntry) {
        await editEntry(selectedEntry.id, editorData.title.trim(), editorData.content.trim(), editorData.date);
        setNotification({ type: 'success', message: 'Entry updated!' });
      } else {
        const newEntry = await createEntry(editorData.title.trim(), editorData.content.trim(), editorData.date);
        setSelectedEntry(newEntry);
        setNotification({ type: 'success', message: 'Entry saved!' });
      }
      setIsEditing(false);
    } catch {
      setNotification({ type: 'error', message: 'Failed to save entry.' });
    }
  };

  const handleDelete = async (id: string) => {
    await removeEntry(id);
    setShowDeleteConfirm(null);
    if (selectedEntry?.id === id) {
      setSelectedEntry(null);
      setViewMode('list');
    }
    setNotification({ type: 'success', message: 'Entry deleted.' });
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedEntry(null);
    setIsEditing(false);
  };

  const formatEntryDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  const formatEntryDateFull = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'EEEE, MMMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <BookOpen className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-800 hidden sm:block">My Diary</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">
            <HardDrive className="w-3.5 h-3.5" />
            <span className="truncate max-w-[150px]">{dirName}</span>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg">
            <User className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">{currentUser?.name}</span>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Installation Guide"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Guide</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar / Entry List */}
        <aside
          className={`${
            showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } fixed lg:relative inset-y-0 left-0 top-[57px] lg:top-0 z-20 w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-100 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Entries
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {entries.length}
                </span>
              </h2>
              <button
                onClick={handleNewEntry}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md shadow-indigo-200 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-1">
              {(['all', 'today', 'week', 'month'] as FilterPeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setFilterPeriod(period)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filterPeriod === period
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {period === 'all' ? 'All' : period === 'today' ? 'Today' : period === 'week' ? 'Week' : 'Month'}
                </button>
              ))}
            </div>
          </div>

          {/* Entry List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <StickyNote className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-400 font-medium">No entries found</p>
                <p className="text-xs text-gray-400 mt-1">
                  {searchQuery ? 'Try a different search term' : 'Click "+ New" to create your first entry'}
                </p>
              </div>
            ) : (
              <div className="py-2">
                {groupedEntries.map((group) => (
                  <div key={group.label}>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/80 sticky top-0">
                      {group.label}
                    </div>
                    {group.entries.map((entry) => (
                      <div
                        key={entry.id}
                        onClick={() => {
                          handleViewEntry(entry);
                          if (window.innerWidth < 1024) setShowSidebar(false);
                        }}
                        className={`mx-2 my-1 p-3 rounded-xl cursor-pointer transition-all hover:bg-indigo-50 group ${
                          selectedEntry?.id === entry.id
                            ? 'bg-indigo-50 border border-indigo-200 shadow-sm'
                            : 'border border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm text-gray-800 truncate">{entry.title}</h3>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                              {entry.content.substring(0, 120)}
                              {entry.content.length > 120 ? '...' : ''}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                <Calendar className="w-3 h-3" />
                                {formatEntryDate(entry.date)}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                <Clock className="w-3 h-3" />
                                {format(parseISO(entry.updatedAt), 'h:mm a')}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEntry(entry);
                              }}
                              className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(entry.id);
                              }}
                              className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {showSidebar && (
          <div
            className="fixed inset-0 bg-black/20 z-10 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {viewMode === 'list' && !selectedEntry ? (
            /* Welcome / Empty State */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Welcome, {currentUser?.name}! 👋
                </h2>
                <p className="text-gray-500 mb-6">
                  Select an entry from the sidebar or create a new one to start writing.
                </p>
                <button
                  onClick={handleNewEntry}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  Write New Entry
                </button>

                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-2xl font-bold text-indigo-600">{entries.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Total Entries</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-2xl font-bold text-purple-600">
                      {entries.filter((e) => isToday(parseISO(e.date))).length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Today</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-2xl font-bold text-pink-600">
                      {entries.filter((e) => isThisWeek(parseISO(e.date), { weekStartsOn: 1 })).length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">This Week</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Editor / Viewer */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Editor Toolbar */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBackToList}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                  >
                    <ChevronDown className="w-4 h-4 text-gray-600 rotate-90" />
                  </button>
                  <span className="text-sm text-gray-500">
                    {isEditing
                      ? selectedEntry
                        ? 'Editing Entry'
                        : 'New Entry'
                      : 'Viewing Entry'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => {
                          if (!selectedEntry) {
                            handleBackToList();
                          } else {
                            setIsEditing(false);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md shadow-indigo-200 active:scale-95"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => selectedEntry && handleEditEntry(selectedEntry)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => selectedEntry && setShowDeleteConfirm(selectedEntry.id)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Editor Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto p-6 lg:p-10">
                  {isEditing ? (
                    <div className="space-y-5">
                      <div>
                        <input
                          type="text"
                          value={editorData.title}
                          onChange={(e) => setEditorData((p) => ({ ...p, title: e.target.value }))}
                          placeholder="Entry Title..."
                          className="w-full text-2xl lg:text-3xl font-bold text-gray-900 placeholder-gray-300 outline-none border-none bg-transparent"
                          autoFocus
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          value={editorData.date}
                          onChange={(e) => setEditorData((p) => ({ ...p, date: e.target.value }))}
                          className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                      <div className="border-t border-gray-100 pt-4">
                        <textarea
                          value={editorData.content}
                          onChange={(e) => setEditorData((p) => ({ ...p, content: e.target.value }))}
                          placeholder="Write your thoughts here..."
                          className="w-full min-h-[400px] text-gray-700 leading-relaxed outline-none border-none bg-transparent resize-none text-base lg:text-lg placeholder-gray-300"
                        />
                      </div>
                    </div>
                  ) : selectedEntry ? (
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                        {selectedEntry.title}
                      </h2>
                      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                        <span className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {formatEntryDateFull(selectedEntry.date)}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {format(parseISO(selectedEntry.updatedAt), 'h:mm a')}
                        </span>
                      </div>
                      <div className="prose prose-lg max-w-none">
                        {selectedEntry.content.split('\n').map((para, i) => (
                          <p key={i} className="text-gray-700 leading-relaxed mb-4">
                            {para || <br />}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Delete Entry?</h3>
            <p className="text-sm text-center text-gray-500 mb-6">
              This action cannot be undone. The entry will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      <GuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
}
