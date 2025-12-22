import React from 'react';
import { X, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, ArrowLeftRight, Info } from 'lucide-react';
import { SyncLog } from '../types';

interface HistoryDetailModalProps {
  log: SyncLog | null;
  isOpen: boolean;
  onClose: () => void;
}

const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({ log, isOpen, onClose }) => {
  if (!isOpen || !log) return null;

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'In progress...';
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationMs = endTime - startTime;
    const seconds = Math.floor(durationMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const getStatusBadge = (status: SyncLog['status']) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
            <CheckCircle2 size={14} />
            Успішно
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
            <XCircle size={14} />
            Помилка
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
            <AlertCircle size={14} />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Деталі синхронізації</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Header Info */}
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">{log.product_name || "Без назви"}</h4>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                 <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {new Date(log.started_at).toLocaleString('uk-UA')}
                 </div>
                 <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {formatDuration(log.started_at, log.completed_at)}
                 </div>
              </div>
            </div>
            {getStatusBadge(log.status)}
          </div>

          {/* IDs */}
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">ID Джерела</span>
                <span className="font-mono text-sm font-bold text-gray-700">{log.source_id}</span>
             </div>
             <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">Цільовий ID</span>
                <span className="font-mono text-sm font-bold text-blue-700">{log.target_id}</span>
             </div>
          </div>

          {/* Changes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
               <ArrowLeftRight size={16} className="text-gray-400" />
               <h5 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Змінені дані</h5>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
               {log.details ? (
                  <ul className="space-y-2">
                    {log.details.split(';').map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                        {detail.trim()}
                      </li>
                    ))}
                  </ul>
               ) : (
                  <p className="text-sm text-gray-500 italic">Дані про зміни відсутні</p>
               )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
           <button 
             onClick={onClose}
             className="px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 rounded-xl transition-all"
           >
             Закрити
           </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryDetailModal;
