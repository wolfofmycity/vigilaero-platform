/*
 * VigilAero - Advanced UAV Protection Platform
 * Copyright (c) 2024 VigilAero. All rights reserved.
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Reuse the same /auth/me helper
async function fetchMe() {
  try {
    const res = await fetch("http://127.0.0.1:8001/auth/me", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("vigil_token")}`,
      },
    });
    if (!res.ok) throw new Error("unauthorized");
    return await res.json();
  } catch {
    return null;
  }
}

const Header = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const data = await fetchMe();
      if (!cancelled) setMe(data);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("vigil_token");
    navigate("/login");
  };

  const isOnline = true; // for now, static

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* VigilAero logo */}
          <div className="w-10 h-10 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Shield */}
              <path
                d="M50 10 L20 25 L20 60 Q20 80 50 90 Q80 80 80 60 L80 25 Z"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
              />
              {/* Drone body */}
              <ellipse cx="50" cy="45" rx="8" ry="4" fill="#9ca3af" />
              {/* Drone arms */}
              <line
                x1="35"
                y1="40"
                x2="42"
                y2="43"
                stroke="#9ca3af"
                strokeWidth="2"
              />
              <line
                x1="65"
                y1="40"
                x2="58"
                y2="43"
                stroke="#9ca3af"
                strokeWidth="2"
              />
              <line
                x1="35"
                y1="50"
                x2="42"
                y2="47"
                stroke="#9ca3af"
                strokeWidth="2"
              />
              <line
                x1="65"
                y1="50"
                x2="58"
                y2="47"
                stroke="#9ca3af"
                strokeWidth="2"
              />
              {/* Propellers */}
              <ellipse cx="35" cy="40" rx="4" ry="1" fill="#9ca3af" />
              <ellipse cx="65" cy="40" rx="4" ry="1" fill="#9ca3af" />
              <ellipse cx="35" cy="50" rx="4" ry="1" fill="#9ca3af" />
              <ellipse cx="65" cy="50" rx="4" ry="1" fill="#9ca3af" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">VigilAero</h1>
            <p className="text-sm text-gray-400">
              Advanced UAV Protection Platform
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* System status */}
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isOnline ? "bg-green-400 animate-pulse" : "bg-gray-500"
              }`}
            ></div>
            <span className="text-sm text-gray-300">
              {isOnline ? "System Online" : "System Offline"}
            </span>
          </div>

          {/* User + Logout */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              <span className="text-sm text-gray-300">
                {me ? `${me.role} • ${me.company_id}` : "Loading…"}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1 rounded-md border border-gray-600
                         text-gray-200 hover:bg-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
