import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CropMonitoring } from './components/CropMonitoring';
import { DisasterAssessment } from './components/DisasterAssessment';
import { FieldsManager } from './components/FieldsManager';
import { AnalysisHistory } from './components/AnalysisHistory';
import { SettingsModal } from './components/SettingsModal';
import { RealTimeAlertsDrawer } from './components/RealTimeAlertsDrawer';
import { INITIAL_REALTIME_ALERTS, RealTimeHazardAlert } from './services/realTimeAlerts';
import { SavedField, AnalysisRecord, PolygonCoords } from './types';
import {
  getUser,
  setUser,
  getSavedFields,
  saveField,
  deleteField,
  getAnalyses,
  deleteAnalysis,
  UserProfile,
} from './services/storage';

export function App() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'monitoring' | 'disaster' | 'fields' | 'history'
  >('dashboard');

  const [user, setUserState] = useState<UserProfile>(getUser());
  const [fields, setFields] = useState<SavedField[]>(getSavedFields());
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>(getAnalyses());

  const [selectedFieldForAnalysis, setSelectedFieldForAnalysis] = useState<SavedField | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Real-Time Alerts state
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);
  const [alerts, setAlerts] = useState<RealTimeHazardAlert[]>(INITIAL_REALTIME_ALERTS);
  const [flyTarget, setFlyTarget] = useState<{
    lat: number;
    lng: number;
    name: string;
    layer?: any;
    coords?: PolygonCoords;
  } | null>(null);

  // Sync state when changes happen
  const handleSaveNewField = (field: Omit<SavedField, 'id'>) => {
    const saved = saveField(field);
    setFields(getSavedFields());
    setSelectedFieldForAnalysis(saved);
  };

  const handleDeleteField = (id: string) => {
    const updated = deleteField(id);
    setFields(updated);
  };

  const handleDeleteAnalysis = (id: string) => {
    const updated = deleteAnalysis(id);
    setAnalyses(updated);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    setUserState(updatedUser);
  };

  const handleResetData = () => {
    localStorage.removeItem('cropsense_fields_v2');
    localStorage.removeItem('cropsense_analyses_v2');
    setFields(getSavedFields());
    setAnalyses(getAnalyses());
    setIsSettingsOpen(false);
  };

  const handleNavigate = (
    tab: 'monitoring' | 'disaster' | 'fields' | 'history',
    presetId?: string
  ) => {
    if (presetId) {
      setSelectedPresetId(presetId);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectFieldForAnalysis = (field: SavedField) => {
    setSelectedFieldForAnalysis(field);
    setSelectedPresetId(null);
    setActiveTab('monitoring');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fly Shiva Station to alert location and switch to appropriate layer
  const handleNavigateToAlert = (alert: RealTimeHazardAlert) => {
    setFlyTarget({
      lat: alert.coordinates[0],
      lng: alert.coordinates[1],
      name: alert.villageOrTown,
      layer: alert.recommendedLayer,
      coords: alert.suggestedPolygon,
    });
    setIsAlertsDrawerOpen(false);
    if (alert.type === 'flood' || alert.type === 'drought') {
      setActiveTab('disaster');
    } else {
      setActiveTab('monitoring');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        user={user}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRealTimeAlerts={() => setIsAlertsDrawerOpen(true)}
        alertCount={alerts.length}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView
            fields={fields}
            analyses={analyses}
            onNavigate={handleNavigate}
            onSelectFieldForAnalysis={handleSelectFieldForAnalysis}
            onOpenAlerts={() => setIsAlertsDrawerOpen(true)}
          />
        )}

        {activeTab === 'monitoring' && (
          <CropMonitoring
            fields={fields}
            onSaveNewField={handleSaveNewField}
            selectedField={selectedFieldForAnalysis}
            presetId={selectedPresetId}
            onOpenAlerts={() => setIsAlertsDrawerOpen(true)}
            flyTarget={flyTarget}
          />
        )}

        {activeTab === 'disaster' && (
          <DisasterAssessment
            fields={fields}
            presetId={selectedPresetId}
            onOpenAlerts={() => setIsAlertsDrawerOpen(true)}
            flyTarget={flyTarget}
          />
        )}

        {activeTab === 'fields' && (
          <FieldsManager
            fields={fields}
            onDeleteField={handleDeleteField}
            onSelectFieldForAnalysis={handleSelectFieldForAnalysis}
            onNavigateToDraw={() => {
              setSelectedFieldForAnalysis(null);
              setActiveTab('monitoring');
            }}
          />
        )}

        {activeTab === 'history' && (
          <AnalysisHistory
            analyses={analyses}
            onDeleteAnalysis={handleDeleteAnalysis}
          />
        )}
      </main>

      {/* Real-Time Alerts Drawer */}
      <RealTimeAlertsDrawer
        isOpen={isAlertsDrawerOpen}
        onClose={() => setIsAlertsDrawerOpen(false)}
        alerts={alerts}
        onNavigateToAlert={handleNavigateToAlert}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
        onResetData={handleResetData}
      />

      {/* Clean Professional Footer */}
      <footer className="bg-white border-t border-stone-200 py-6 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">CropSense AI</span>
            <span>&middot;</span>
            <span>AI-Based Agricultural Monitoring &amp; Disaster Assessment System</span>
          </div>

          <div className="flex items-center gap-4 text-stone-400">
            <span>Sentinel-1 SAR Radar &amp; Sentinel-2 MSI</span>
            <span>&middot;</span>
            <span>Automated Field Delineation &amp; NDVI Telemetry</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
