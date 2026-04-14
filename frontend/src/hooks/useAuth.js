import { useState, useCallback, useEffect } from 'react';
import { authApi, accountApi } from '../services/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      if (!localStorage.getItem('token')) throw new Error("No token");
      const { data } = await accountApi.get('/me');
      setUser(data);
    } catch (err) {
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (email, password) => {
    const { data } = await authApi.post('/login', { email, password });
    localStorage.setItem('token', data.access_token);
    await fetchProfile();
  };

  const register = async (userData) => {
    await accountApi.post('/', userData);
    await login(userData.email, userData.password);
  };

  const logout = async () => {
    try {
      await authApi.post('/logout');
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  return { user, loading, login, register, logout };
}
