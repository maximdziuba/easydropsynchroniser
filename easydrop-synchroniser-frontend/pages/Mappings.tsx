import React, { useState, useEffect } from 'react';
import { ProductConnection, AppSettings } from '../types';
import { api } from '../api';
import { Plus, Search, Link2, Trash2 } from 'lucide-react';
import MappingModal from '../components/MappingModal';

const Mappings: React.FC = () => {
  const [connections, setConnections] = useState<ProductConnection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMappings();
      setConnections(data);
    } catch (e) {
      console.error("Failed to load mappings", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddConnection = async (data: { sourceId: string; targetId: string; productName: string }) => {
    try {
      const newMapping = await api.createMapping({
        source_id: parseInt(data.sourceId),
        target_id: parseInt(data.targetId),
        product_name: data.productName
      });
      setConnections([...connections, newMapping]);
      setIsModalOpen(false);
    } catch (e) {
      alert("Failed to create connection");
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Ви впевнені, що хочете видалити цей зв’язок?')) {
      try {
        await api.deleteMapping(id);
        setConnections(connections.filter(c => c.id !== id));
      } catch (e) {
        alert("Failed to delete connection");
        console.error(e);
      }
    }
  };

  const filteredConnections = connections.filter(
    (c) =>
      c.source_id.toString().includes(searchQuery) ||
      c.target_id.toString().includes(searchQuery) ||
      (c.product_name && c.product_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Зв’язки товарів</h1>
          <p className="text-gray-500 mt-1 text-sm">Керування відповідністю ідентифікаторів між двома CRM.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
        >
          <Plus size={18} />
          Додати зв’язок
        </button>
      </header>

      <div className="space-y-6">
        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Пошук за ID або назвою..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm shadow-sm transition-all"
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/80 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Товар</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">ID Джерела (Source)</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Цільовий ID (Target)</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredConnections.map((conn) => (
                  <tr key={conn.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{conn.product_name || "Без назви"}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-tight">
                        Створено: {conn.created_at ? new Date(conn.created_at).toLocaleDateString('uk-UA') : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg border border-gray-200">
                        {conn.source_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100">
                        {conn.target_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(conn.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Видалити зв’язок"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredConnections.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center opacity-40">
                        <Link2 size={40} className="mb-2 text-gray-400" />
                        <p className="text-sm font-medium text-gray-500">Зв’язків не знайдено</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <MappingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnect={handleAddConnection}
      />
    </>
  );
};

export default Mappings;
