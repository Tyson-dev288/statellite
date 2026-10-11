import React, { useState } from 'react';
import { AnalysisRecord } from '../types';
import {
  Calendar,
  Filter,
  Download,
  Trash2,
  ExternalLink,
  Search,
  Activity,
  Waves,
  Sun,
  Layers,
} from 'lucide-react';

interface AnalysisHistoryProps {
  analyses: AnalysisRecord[];
  onDeleteAnalysis: (id: string) => void;
}

export const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({
  analyses,
  onDeleteAnalysis,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'crop' | 'flood' | 'drought'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);

  const filtered = analyses.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.fieldName && item.fieldName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Type', 'Title', 'Date', 'Summary', 'Key Metric'];
    const rows = filtered.map((r) => [
      r.id,
      r.type,
      `"${r.title}"`,
      r.createdAt,
      `"${r.summary}"`,
      r.details.ndvi ?? r.details.floodedHa ?? r.details.zScore ?? '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cropsense_satellite_analyses_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded">
              Shiva Station
            </span>
            <span className="text-xs text-stone-500">Historical Telemetry Log</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Shiva · Satellite Analysis Audit Log
          </h1>
          <p className="text-xs text-stone-500">
            Historical record of all multi-spectral, heat, flood, and radar assessments.
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="px-4 py-2.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-medium text-xs transition-colors flex items-center gap-2 whitespace-nowrap shadow-xs self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-stone-500" />
          <span>Export History (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-lg text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Logs ({analyses.length})
          </button>
          <button
            onClick={() => setFilterType('crop')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'crop'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            NDVI Health
          </button>
          <button
            onClick={() => setFilterType('flood')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'flood'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Flood SAR
          </button>
          <button
            onClick={() => setFilterType('drought')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'drought'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Drought Anomaly
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 placeholder-stone-400 outline-none"
          />
        </div>
      </div>

      {/* Table of Analyses */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-stone-200">
            <thead className="bg-stone-50 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Analysis Type</th>
                <th className="p-3.5">Title &amp; Parcel</th>
                <th className="p-3.5">Acquisition Date</th>
                <th className="p-3.5">Primary Finding</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-stone-400 text-xs">
                    No matching satellite evaluations recorded.
                  </td>
                </tr>
              ) : (
                filtered.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-stone-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 font-medium ${
                          record.type === 'crop'
                            ? 'text-emerald-700'
                            : record.type === 'flood'
                            ? 'text-blue-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {record.type === 'crop' && <Activity className="w-3.5 h-3.5" />}
                        {record.type === 'flood' && <Waves className="w-3.5 h-3.5" />}
                        {record.type === 'drought' && <Sun className="w-3.5 h-3.5" />}
                        <span className="capitalize">{record.type}</span>
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-stone-900">{record.title}</div>
                      {record.fieldName && (
                        <div className="text-[11px] text-stone-500">{record.fieldName}</div>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-stone-500">
                      {new Date(record.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3.5 text-stone-600 max-w-md truncate">
                      {record.summary}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(record);
                        }}
                        className="text-stone-500 hover:text-emerald-700 font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteAnalysis(record.id);
                        }}
                        className="text-stone-400 hover:text-rose-600"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                  Log Record {selectedRecord.id}
                </span>
                <h3 className="text-base font-bold text-stone-900 mt-0.5">
                  {selectedRecord.title}
                </h3>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded capitalize ${
                  selectedRecord.type === 'crop'
                    ? 'bg-emerald-50 text-emerald-800'
                    : selectedRecord.type === 'flood'
                    ? 'bg-blue-50 text-blue-800'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                {selectedRecord.type}
              </span>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-200">
              {selectedRecord.summary}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-stone-50 p-2.5 rounded border border-stone-200">
                <span className="text-stone-400 block text-[11px]">Logged At</span>
                <span className="font-mono text-stone-800">
                  {new Date(selectedRecord.createdAt).toUTCString()}
                </span>
              </div>
              <div className="bg-stone-50 p-2.5 rounded border border-stone-200">
                <span className="text-stone-400 block text-[11px]">Field Boundary</span>
                <span className="font-mono text-stone-800">
                  {selectedRecord.coords?.length || 0} polygon vertices
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
