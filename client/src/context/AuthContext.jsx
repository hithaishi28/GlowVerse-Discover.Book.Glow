import { createContext, useContext, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

const demoUsers = {
  user: { id: 'demo-user', name: 'Aarohi Sharma', age: 27, gender: 'female', email: 'demo@glowverse.app', role: 'user', membershipTier: 'gold', rewardsPoints: 2450 },
  owner: { id: 'demo-owner', name: 'Salon Owner', age: 34, gender: 'prefer_not_to_say', email: 'owner@glowverse.app', role: 'owner', membershipTier: 'platinum', rewardsPoints: 3200 },
  admin: { id: 'demo-admin', name: 'Admin', age: 31, gender: 'prefer_not_to_say', email: 'admin@glowverse.app', role: 'admin', membershipTier: 'platinum', rewardsPoints: 5000 }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('glowverse_user');
    return saved ? JSON.parse(saved) : null;
  });

  function persist(nextUser, token = 'demo-token') {
    localStorage.setItem('glowverse_token', token);
    localStorage.setItem('glowverse_user', JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }

  async function login(email = 'demo@glowverse.app', password = 'Password123!', requestedRole = 'user') {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      return persist(data.user, data.token);
    } catch {
      return persist(demoUsers[requestedRole] || demoUsers.user);
    }
  }

  async function demoLogin(role = 'user') {
    const email = role === 'admin' ? 'admin@glowverse.app' : role === 'owner' ? 'owner@glowverse.app' : 'demo@glowverse.app';
    return login(email, 'Password123!', role);
  }

  function startDemoSession(role = 'user') {
    return persist(demoUsers[role] || demoUsers.user, 'demo-token');
  }

  async function register(payload) {
    try {
      const { data } = await api.post('/auth/register', payload);
      return persist(data.user, data.token);
    } catch {
      const role = payload.role || 'user';
      const baseUser = demoUsers[role] || demoUsers.user;
      return persist({ ...baseUser, name: payload.name || baseUser.name, age: Number(payload.age) || baseUser.age, gender: payload.gender || baseUser.gender, email: payload.email || baseUser.email });
    }
  }

  function logout() {
    localStorage.removeItem('glowverse_token');
    localStorage.removeItem('glowverse_user');
    setUser(null);
  }

  const value = useMemo(() => ({ user, login, demoLogin, startDemoSession, register, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
