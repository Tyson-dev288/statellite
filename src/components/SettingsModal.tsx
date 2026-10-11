import React, { useState } from 'react';
import { getApiBaseUrl, setApiBaseUrl } from '../services/satelliteEngine';
import { UserProfile } from '../services/storage';
import { Settings, Server, Globe, Check, AlertCircle, RefreshCw, X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onResetData,
}) => {
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    ok?: boolean;
    message?: string;
  } | null>(null);

  const [displayName, setDisplayName] = useState(user.displayName);
  const [organization, setOrganization] = useState(user.organization);
  const [role, setRole] = useState(user.role);

  if (!isOpen) return null;

  const handleSaveApi = () => {
    setApiBaseUrl(apiUrl);
    setTestStatus({ ok: true, message: 'API Base URL saved successfully.' });
  };

  const handleTestConnection = async () => {
    if (!apiUrl) {
      setTestStatus({
        ok: false,
        message: 'No URL specified. Operating in high-fidelity browser simulation mode.',
      });
      return;
    }
    setIsTesting(true);
    setTestStatus(null);
    try {
      const res = await fetch(`${apiUrl}/`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setTestStatus({
          ok: true,
          message: `Connected successfully! (${data.status || 'OK'})`,
        });
      } else {
        setTestStatus({
          ok: false,
          message: `Backend returned HTTP ${res.status}. Check CORS or server state.`,
        });
      }
    } catch (e: any) {
      setTestStatus({
        ok: false,
        message: `Could not reach ${apiUrl}. Ensure your FastAPI server is running with CORS enabled.`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      displayName,
      organization,
      role,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-stone-900">
              System Settings &amp; API Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Backend API Configuration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-stone-800 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-stone-600" />
              <span>FastAPI Backend URL</span>
            </label>
            <span className="text-[11px] text-stone-400 font-mono">VITE_API_BASE_URL</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. http://localhost:8000"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-800 font-mono outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold whitespace-nowrap"
            >
              {isTesting ? 'Testing...' : 'Test Ping'}
            </button>
            <button
              type="button"
              onClick={handleSaveApi}
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap"
            >
              Save
            </button>
          </div>

          <p className="text-[11px] text-stone-500 leading-normal">
            Leave blank to use the built-in satellite processing engine, or enter your deployed FastAPI URL.
          </p>

          {testStatus && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                testStatus.ok
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testStatus.ok ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{testStatus.message}</span>
            </div>
          )}
        </div>

        {/* User Profile Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4 pt-3 border-t border-stone-100 text-xs">
          <h3 className="font-bold text-stone-800">Operator Profile</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 font-medium mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-stone-800 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-stone-600 font-medium mb-1">Role / Specialization</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-stone-800 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-600 font-medium mb-1">Organization / Department</label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-stone-800 outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onResetData}
              className="text-stone-400 hover:text-rose-600 text-[11px] flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Data to Presets</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Save Profile
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
