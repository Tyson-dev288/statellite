import React, { useState } from 'react';
import { SavedField } from '../types';
import { computeVegetationDensity } from '../services/satelliteEngine';
import {
  MapPin,
  Calendar,
  Trash2,
  Activity,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Crop,
  Layers,
  Trees,
  Compass,
} from 'lucide-react';

interface FieldsManagerProps {
  fields: SavedField[];
  onDeleteField: (id: string) => void;
  onSelectFieldForAnalysis: (field: SavedField) => void;
  onNavigateToDraw: () => void;
}

export const FieldsManager: React.FC<FieldsManagerProps> = ({
  fields,
  onDeleteField,
  onSelectFieldForAnalysis,
  onNavigateToDraw,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState('All');

  const cropTypes = ['All', ...Array.from(new Set(fields.map((f) => f.cropType)))];

  const filteredFields = fields.filter((f) => {
    const matchesQuery =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.locationDetails?.villageOrTown &&
        f.locationDetails.villageOrTown.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCrop =
      selectedCropFilter === 'All' || f.cropType === selectedCropFilter;
    return matchesQuery && matchesCrop;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded">
              Shiva Station
            </span>
            <span className="text-xs text-stone-500">Agricultural Boundary Catalog</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Shiva · Registered Farmland Parcels
          </h1>
          <p className="text-xs text-stone-500">
            Field boundary measurements, village &amp; locality identification, exact NDVI, and canopy vegetation density.
          </p>
        </div>

        <button
          onClick={onNavigateToDraw}
          className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors flex items-center gap-2 whitespace-nowrap shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Draw &amp; Measure New Boundary</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by field name, village, town, or district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 placeholder-stone-400 outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-stone-500 whitespace-nowrap">Filter Crop:</span>
          <select
            value={selectedCropFilter}
            onChange={(e) => setSelectedCropFilter(e.target.value)}
            className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-stone-700 outline-none"
          >
            {cropTypes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fields Grid */}
      {filteredFields.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center space-y-3">
          <div className="text-3xl">🌾</div>
          <h3 className="text-sm font-semibold text-stone-800">No field parcels found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Try modifying your search or crop filters.'
              : 'Draw your first agricultural plot on the interactive map.'}
          </p>
          <button
            onClick={onNavigateToDraw}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
          >
            Open Map Drawing Tool
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFields.map((field) => {
            const effectiveNdvi = field.lastNdvi ?? 0.65;
            const density = computeVegetationDensity(effectiveNdvi);

            return (
              <div
                key={field.id}
                className="bg-white rounded-xl border border-stone-200 p-5 hover:border-emerald-300 transition-all shadow-xs flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm group-hover:text-emerald-700 transition-colors">
                        {field.name}
                      </h3>
                      <div className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-medium text-stone-700 truncate">
                          {field.locationDetails?.villageOrTown || field.locationName}
                        </span>
                      </div>
                      {field.locationDetails?.district && (
                        <div className="text-[11px] text-stone-400 pl-4.5">
                          {field.locationDetails.district}, {field.locationDetails.state}
                        </div>
                      )}
                    </div>

                    {/* Density Badge */}
                    <span
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded text-white shadow-xs shrink-0"
                      style={{ backgroundColor: density.color }}
                    >
                      {density.category}
                    </span>
                  </div>

                  {/* Metrics Matrix: Area, Exact NDVI, Cover, Sowing Date */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 text-xs">
                    <div className="bg-stone-50 p-2 rounded">
                      <span className="text-stone-400 block text-[10px]">Measured Area</span>
                      <span className="font-mono font-bold text-stone-900 text-xs tabular-nums">
                        {field.areaHectares} ha
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        {(field.areaHectares * 2.471).toFixed(1)} acres
                      </span>
                    </div>

                    <div className="bg-stone-50 p-2 rounded">
                      <span className="text-stone-400 block text-[10px]">Exact Mean NDVI</span>
                      <span
                        className="font-mono font-bold text-xs tabular-nums"
                        style={{ color: density.color }}
                      >
                        {effectiveNdvi.toFixed(3)}
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        LAI {density.lai} m²/m²
                      </span>
                    </div>

                    <div className="bg-stone-50 p-2 rounded">
                      <span className="text-stone-400 block text-[10px]">Crop &amp; Cover</span>
                      <span className="font-medium text-stone-800 text-xs block truncate">
                        {field.cropType}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-mono block">
                        {density.fvcPercent}% Canopy Cover
                      </span>
                    </div>

                    <div className="bg-stone-50 p-2 rounded">
                      <span className="text-stone-400 block text-[10px]">Sowing Date</span>
                      <span className="font-mono text-stone-700 text-xs block">
                        {field.sowingDate}
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        {field.healthStatus || 'Healthy'}
                      </span>
                    </div>
                  </div>

                  {field.notes && (
                    <p className="text-[11px] text-stone-500 italic bg-stone-50 p-2 rounded">
                      &ldquo;{field.notes}&rdquo;
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onDeleteField(field.id)}
                    className="text-stone-400 hover:text-rose-600 text-xs flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectFieldForAnalysis(field)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Inspect Spectral Map &rarr;</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
