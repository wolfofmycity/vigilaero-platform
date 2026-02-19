/*
 * VigilAero - Advanced UAV Protection Platform
 * Copyright (c) 2025 VigilAero. All rights reserved.
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */

import React from 'react';
import {
  Monitor,
  Shield,
  Settings,
  AlertTriangle,
  CheckCircle,
  Download,
  Radar
} from 'lucide-react';

const NavigationTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'monitor', label: 'Security Monitor', icon: Monitor },
    // NEW: fleet overview tab
    { id: 'fleet', label: 'Fleet Overview', icon: Radar },
    { id: 'threats', label: 'Threat Simulation', icon: AlertTriangle },
    { id: 'response', label: 'Incident Response', icon: Shield },
    { id: 'compliance', label: 'Compliance', icon: CheckCircle },
    { id: 'protection', label: 'Protection Systems', icon: Shield },
    { id: 'reports', label: 'Reports', icon: Download },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="border-b border-gray-700 mb-6">
      <nav className="flex space-x-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default NavigationTabs;
