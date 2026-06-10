import { useApp } from '../context/AppContext';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export default function Notification() {
  const { notification, setNotification } = useApp();
  if (!notification) return null;

  const styles = {
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: <XCircle className="w-5 h-5 text-red-500" />,
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-500" />,
    },
  };

  const s = styles[notification.type];

  return (
    <div className="fixed top-4 right-4 z-[100] animate-slide-in">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${s.bg} min-w-[280px] max-w-md`}
      >
        {s.icon}
        <p className={`text-sm font-medium flex-1 ${s.text}`}>{notification.message}</p>
        <button
          onClick={() => setNotification(null)}
          className="p-1 hover:bg-black/5 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
