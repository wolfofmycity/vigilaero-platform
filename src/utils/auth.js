// src/utils/auth.js
const API = 'http://localhost:8010'; // keep in sync with your backend

export function setToken(token) {
  localStorage.setItem('vigil_token', token);
  localStorage.setItem('token', token);
}
export function getToken() {
  return localStorage.getItem('vigil_token');
}
export function clearToken() {
  localStorage.removeItem('vigil_token');
}
export function getAuthHeader() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function loginAsAdmin() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'password123' })
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    console.error('LOGIN FAILED', res.status, msg);
    throw new Error('login failed');
  }

  const data = await res.json(); // { access_token, token_type }
  setToken(data.access_token);
  return data;
}

export function logout() {
  clearToken(); // client-side logout for now
  return true;
}

// optional helper if/when you add /auth/me
export async function fetchMe() {
  const res = await fetch(`${API}/auth/me`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
  });
  if (!res.ok) return null;
  return res.json();
}

export { API };
