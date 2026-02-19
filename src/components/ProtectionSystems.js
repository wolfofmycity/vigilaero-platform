/*
 * VigilAero - Advanced UAV Protection Platform
 * Copyright (c) 2025 VigilAero. All rights reserved.
 * 
 * ENTERPRISE EDITION - Refined for regulatory/SOC environments
 */

import React, { useState } from 'react';
import { Radio, Lock, Satellite, Shield, Wifi, CheckCircle } from 'lucide-react';

const ProtectionSystems = () => {
  // State for toggles
  const [protectionStates, setProtectionStates] = useState({
    frequencyHopping: true,
    signalEncryption: true,
    antiJamming: true,
    mfa: true,
    biometricLock: false,
    sessionTimeout: true,
    spoofingDetection: true,
    multiConstellation: true,
    insBackup: true,
    behavioralAnalysis: true,
    networkMonitoring: true,
    realTimeAlerts: true,
  });

  const handleToggle = (key) => {
    setProtectionStates((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Reusable toggle component with Tailwind styling
  const ToggleSwitch = ({ checked, onChange }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-emerald-600' : 'bg-slate-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Protection Systems Grid - ENTERPRISE: Clean cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RF Security */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Radio className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-50">RF Security</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Frequency Hopping</span>
              <ToggleSwitch
                checked={protectionStates.frequencyHopping}
                onChange={() => handleToggle('frequencyHopping')}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Signal Encryption</span>
              <ToggleSwitch
                checked={protectionStates.signalEncryption}
                onChange={() => handleToggle('signalEncryption')}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Anti-Jamming</span>
              <ToggleSwitch
                checked={protectionStates.antiJamming}
                onChange={() => handleToggle('antiJamming')}
              />
            </div>
          </div>
        </div>

        {/* Access Control */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-50">Access Control</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Multi-Factor Auth</span>
              <ToggleSwitch
                checked={protectionStates.mfa}
                onChange={() => handleToggle('mfa')}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Biometric Lock</span>
              <ToggleSwitch
                checked={protectionStates.biometricLock}
                onChange={() => handleToggle('biometricLock')}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Session Timeout</span>
              <ToggleSwitch
                checked={protectionStates.sessionTimeout}
                onChange={() => handleToggle('sessionTimeout')}
              />
            </div>
          </div>
        </div>

        {/* GPS Protection */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Satellite className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-50">GPS Protection</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Spoofing Detection</span>
              <ToggleSwitch
                checked={protectionStates.spoofingDetection}
                onChange={() => handleToggle('spoofingDetection')}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Multi-Constellation</span>
              <ToggleSwitch
                checked={protectionStates.multiConstellation}
                onChange={() => handleToggle('multiConstellation')}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">INS Backup</span>
              <ToggleSwitch
                checked={protectionStates.insBackup}
                onChange={() => handleToggle('insBackup')}
              />
            </div>
          </div>
        </div>

        {/* Intrusion Detection */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <Shield className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-50">Intrusion Detection</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Behavioral Analysis</span>
              <ToggleSwitch
                checked={protectionStates.behavioralAnalysis}
                onChange={() => handleToggle('behavioralAnalysis')}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Network Monitoring</span>
              <ToggleSwitch
                checked={protectionStates.networkMonitoring}
                onChange={() => handleToggle('networkMonitoring')}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Real-time Alerts</span>
              <ToggleSwitch
                checked={protectionStates.realTimeAlerts}
                onChange={() => handleToggle('realTimeAlerts')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* System Status Summary - ENTERPRISE: Clean summary */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/80 overflow-hidden shadow-lg">
        <div className="border-b border-slate-800/60 px-6 py-4 bg-slate-900/60">
          <h2 className="text-sm font-bold text-slate-50">Protection System Status</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time monitoring of active security layers
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-2">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400 tabular-nums">
                {Object.values(protectionStates).filter(Boolean).length}
              </p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Active</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-800/60 border border-slate-700/60 mb-2">
                <Shield className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-400 tabular-nums">
                {Object.values(protectionStates).filter((v) => !v).length}
              </p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Inactive</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-2">
                <Wifi className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-400 tabular-nums">4</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Categories</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-violet-500/10 border border-violet-500/20 mb-2">
                <Shield className="w-6 h-6 text-violet-400" />
              </div>
              <p className="text-2xl font-bold text-violet-400 tabular-nums">
                {Math.round(
                  (Object.values(protectionStates).filter(Boolean).length /
                    Object.values(protectionStates).length) *
                    100
                )}
                %
              </p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Coverage</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectionSystems;