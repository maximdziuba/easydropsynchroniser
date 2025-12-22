import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { SyncLog } from '../types';
import { Clock, CheckCircle2, XCircle, AlertCircle, Calendar, ArrowLeftRight, Info } from 'lucide-react';
import HistoryDetailModal from '../components/HistoryDetailModal';

const History: React.FC = () => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await api.getHistory();
      setLogs(data);
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (log: SyncLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

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
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
            <AlertCircle size={14} />
            Частково
          </span>
        );
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Дата та час</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Статус</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Тривалість</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Товар</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">ID джерела</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Цільовий ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr 
                  key={log.id} 
                  onClick={() => handleRowClick(log)}
                  className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <Calendar size={14} className="text-gray-400 group-hover:text-blue-500" />
                      {new Date(log.started_at).toLocaleString('uk-UA')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(log.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={14} className="text-gray-400" />
                      {formatDuration(log.started_at, log.completed_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {log.product_name || "Без назви"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200">
                      {log.source_id}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right pr-12">
                     <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100">
                          {log.target_id}
                        </span>
                        <Info size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                     </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <Clock size={40} className="mb-2 text-gray-400" />
                      <p className="text-sm font-medium text-gray-500">Історія пуста</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <HistoryDetailModal 
        log={selectedLog}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default History;
