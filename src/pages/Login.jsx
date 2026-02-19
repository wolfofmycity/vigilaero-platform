import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, AlertCircle, Lock, User } from "lucide-react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8010";


const Login = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const text = await res.text();
      console.log("Login raw response:", res.status, text);

      if (!res.ok) {
        let message = "Login failed";
        try {
          const data = JSON.parse(text || "{}");
          if (data.detail) {
            if (typeof data.detail === "string") message = data.detail;
            else if (Array.isArray(data.detail) && data.detail[0]?.msg) message = data.detail[0].msg;
          }
        } catch {
          if (res.status === 404) message = "Endpoint /auth/login not found on backend (404)";
        }
        setError(message);
        return;
      }

      let data = {};
      try {
        data = JSON.parse(text || "{}");
      } catch {
        console.warn("Login response was not JSON:", text);
      }

      const token = data.access_token;
      if (!token) {
        setError("Login succeeded but no access_token returned.");
        return;
      }

      //  Canonical token key (single source of truth)
localStorage.setItem("vigil_token", token);

//  Temporary backward compatibility
localStorage.setItem("access_token", token);

//  Compatibility for evidence API auth
localStorage.setItem("token", token);

//  (pilot ops + forensics attribution later)
localStorage.setItem("vigil_user", username);
localStorage.setItem("vigil_role", data.role || "operator");

navigate("/dashboard");

    } catch (err) {
      console.error("Login network error:", err);
      setError("Network error — cannot reach backend on 8010.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,_#64748b_1px,_transparent_1px)] bg-[length:48px_48px]" />
      </div>

      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl opacity-20 animate-pulse" />
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl opacity-20 animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      <div className="relative w-full max-w-md">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-slate-950/60 blur-2xl opacity-60 group-hover:opacity-100 transition-opacity" />

          <div className="relative rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
            <div className="relative border-b border-slate-800/60 px-8 py-6 bg-gradient-to-r from-blue-950/30 via-slate-900/40 to-blue-950/30">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 opacity-20 blur-md" />
                  <div className="relative flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
                    <Shield className="w-9 h-9 text-white" strokeWidth={2.5} />
                  </div>
                </div>

                <div className="text-center">
                  <h1 className="text-2xl font-bold text-slate-50 tracking-tight mb-1">VigilAero</h1>
                  <p className="text-xs text-slate-400 font-medium">Advanced UAV Protection Platform</p>
                </div>
              </div>
            </div>

            <div className="px-8 pt-6 pb-4">
              <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                <Lock className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Secure Authentication
                </span>
              </div>
            </div>

            {error && (
              <div className="px-8 pb-4">
                <div className="rounded-lg border border-rose-500/40 bg-gradient-to-br from-rose-950/40 to-rose-900/20 px-4 py-3 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-rose-200 font-medium">Authentication Failed</p>
                    <p className="text-xs text-rose-300/80 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                  <input
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-950/60 border border-slate-700/60 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="Enter username"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-950/60 border border-slate-700/60 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter password"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 disabled:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5" />
                    Access Platform
                  </span>
                )}
              </button>
            </form>

            <div className="px-8 pb-6 pt-2 border-t border-slate-800/60">
              <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                <span>Secure Connection</span>
                <span className="text-slate-700">•</span>
                <span>Zero Trust Architecture</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-600">For authorized personnel only</p>
          <p className="text-xs text-slate-700 mt-1">© 2025 VigilAero. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
