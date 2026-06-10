import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FolderOpen,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  BookHeart,
  HardDrive,
  CheckCircle2,
  RefreshCw,
  FolderSync,
  Unplug,
  HelpCircle,
} from 'lucide-react';
import GuideModal from './GuideModal';

export default function AuthPage() {
  const {
    dirHandle,
    dirName,
    isFileSystemSupported,
    pickDirectory,
    disconnectDirectory,
    reconnectSavedHandle,
    hasSavedHandle,
    login,
    register,
    setNotification,
    loading,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirHandle) {
      setNotification({ type: 'error', message: 'Please select a storage folder first.' });
      return;
    }

    if (mode === 'register') {
      if (!formData.name.trim()) {
        setNotification({ type: 'error', message: 'Please enter your name.' });
        return;
      }
      if (formData.password.length < 4) {
        setNotification({ type: 'error', message: 'Password must be at least 4 characters.' });
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setNotification({ type: 'error', message: 'Passwords do not match.' });
        return;
      }
      const result = await register(formData.name.trim(), formData.username.trim(), formData.password);
      setNotification({ type: result.success ? 'success' : 'error', message: result.message });
      if (result.success) {
        setMode('login');
        setFormData({ name: '', username: formData.username, password: '', confirmPassword: '' });
      }
    } else {
      const result = await login(formData.username.trim(), formData.password);
      setNotification({ type: result.success ? 'success' : 'error', message: result.message });
    }
  };

  const handleReconnect = async () => {
    setReconnecting(true);
    await reconnectSavedHandle();
    setReconnecting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      {/* Guide Button - Fixed Position */}
      <button
        onClick={() => setShowGuide(true)}
        className="fixed top-4 right-4 flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-lg border border-gray-200 transition-all hover:shadow-xl z-10"
      >
        <HelpCircle className="w-5 h-5 text-indigo-500" />
        <span className="text-sm font-medium">Installation Guide</span>
      </button>

      {/* Guide Modal */}
      <GuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200 mb-4">
            <BookHeart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">My Personal Diary</h1>
          <p className="text-gray-500 mt-2">Your private notes, stored locally on your computer</p>
        </div>

        {/* Storage Configuration Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 mb-6 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-indigo-500" />
              <h2 className="font-semibold text-gray-800">Storage Location</h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Select a folder on your computer where diary data will be saved as a JSON file.
            </p>
          </div>

          <div className="p-5">
            {!isFileSystemSupported ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                <p className="font-semibold">Browser Not Supported</p>
                <p className="mt-1">
                  Please use <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong> to use this app.
                  The File System Access API is required.
                </p>
              </div>
            ) : dirHandle ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-green-800">Connected</p>
                    <p className="text-xs text-green-600 truncate">📁 {dirName}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={pickDirectory}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                  >
                    <FolderSync className="w-4 h-4" />
                    Change Folder
                  </button>
                  <button
                    onClick={disconnectDirectory}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                  >
                    <Unplug className="w-4 h-4" />
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={pickDirectory}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300 active:scale-[0.98]"
                >
                  <FolderOpen className="w-5 h-5" />
                  Browse & Select Folder
                </button>
                {hasSavedHandle && (
                  <button
                    onClick={handleReconnect}
                    disabled={reconnecting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl border border-amber-200 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${reconnecting ? 'animate-spin' : ''}`} />
                    Reconnect to Previous Folder
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
                mode === 'login'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
                mode === 'register'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))}
                placeholder="Enter username"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm bg-gray-50 focus:bg-white pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData((p) => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !dirHandle}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : mode === 'login' ? (
                <LogIn className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            {!dirHandle && (
              <p className="text-xs text-center text-amber-600 bg-amber-50 rounded-lg p-2">
                ⚠️ Please select a storage folder above before {mode === 'login' ? 'signing in' : 'registering'}
              </p>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          🔒 All data is stored locally on your computer. No server. No cloud. 100% private.
        </p>
      </div>
    </div>
  );
}
