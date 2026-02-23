export function getAuthToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('vigil_token')
  );
}

async function apiFetch(url, options = {}) {
  const token = getAuthToken();
  if (!token) throw new Error('No auth token. Please login again.');

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    let msg = `API error: ${res.status}`;
    try {
      const data = await res.json();
      if (data?.detail) msg = `${msg} - ${data.detail}`;
    } catch (_) {}
    throw new Error(msg);
  }

  return res.json();
}

export function fetchEvidence({
  API_BASE,
  framework_id,
  control_id,
  drone_id,
  date_from,
  date_to,
  limit = 200,
}) {
  const params = new URLSearchParams();
  if (framework_id) params.set('framework_id', framework_id);
  if (control_id) params.set('control_id', control_id);
  if (drone_id) params.set('drone_id', drone_id);
  if (date_from) params.set('date_from', date_from);
  if (date_to) params.set('date_to', date_to);
  params.set('limit', String(limit));

  return apiFetch(`${API_BASE}/api/evidence?${params.toString()}`);
}

export function attachEvidence({ API_BASE, payload }) {
  return apiFetch(`${API_BASE}/api/evidence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function reviewEvidence({ API_BASE, evidenceId, decision, note }) {
  return apiFetch(`${API_BASE}/api/evidence/${evidenceId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, note }),
  });
}

export function fetchEvidenceSummary({
  API_BASE,
  framework_id,
  drone_id,
  date_from,
  date_to,
}) {
  const params = new URLSearchParams();
  if (framework_id) params.set('framework_id', framework_id);
  if (drone_id) params.set('drone_id', drone_id);
  if (date_from) params.set('date_from', date_from);
  if (date_to) params.set('date_to', date_to);

  return apiFetch(`${API_BASE}/api/evidence/summary?${params.toString()}`);
}
