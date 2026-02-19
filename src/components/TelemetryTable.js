import React, { useEffect, useState } from 'react';
import { API, getAuthHeader } from '../utils/auth';

export default function TelemetryTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchTelemetry() {
    try {
      const res = await fetch(`${API}/telemetry`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
      });

      if (!res.ok) {
        console.error("Telemetry fetch failed", res.status);
        return;
      }

      const json = await res.json();
      setData(json.items || []);
    } catch (err) {
      console.error("Telemetry error:", err);
    }
  }

  useEffect(() => {
    fetchTelemetry();            // initial load
    const interval = setInterval(fetchTelemetry, 3000);  // auto-refresh every 3s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md mt-4">
      <h3 className="text-white text-lg font-semibold mb-3">Live Drone Telemetry</h3>

      {loading && data.length === 0 ? (
        <p className="text-gray-300">Loading telemetry...</p>
      ) : (
        <table className="min-w-full text-sm text-left text-gray-300">
          <thead className="bg-gray-700 text-gray-200">
            <tr>
              <th className="px-4 py-2">Drone ID</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Battery</th>
              <th className="px-4 py-2">Link Quality</th>
              <th className="px-4 py-2">Last Heartbeat</th>
              <th className="px-4 py-2">GPS</th>
            </tr>
          </thead>

          <tbody>
            {data.map((d) => (
              <tr key={d.drone_id} className="border-t border-gray-700">
                <td className="px-4 py-2 text-white">{d.drone_id}</td>
                <td className="px-4 py-2">
                  <span
                    className={
                      d.status === "online"
                        ? "text-green-400"
                        : d.status === "warning"
                        ? "text-yellow-400"
                        : "text-red-400"
                    }
                  >
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-2">{d.battery}%</td>
                <td className="px-4 py-2">{d.link_quality}%</td>
                <td className="px-4 py-2 text-gray-400">
                  {d.last_heartbeat ? new Date(d.last_heartbeat).toLocaleTimeString() : "—"}
                </td>
                <td className="px-4 py-2 text-gray-400">
                  {d.gps_lat?.toFixed(4)}, {d.gps_lon?.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
