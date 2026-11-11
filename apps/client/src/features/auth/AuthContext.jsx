import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from './authApi';
import { api } from '../../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('crewensia.session');
    if (!token) {
      setReady(true);
      return;
    }
    authApi.getMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('crewensia.session');
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const acceptSession = useCallback((session, nextUser) => {
    localStorage.setItem('crewensia.session', session.token);
    setUser(nextUser);
  }, []);

  const signIn = useCallback(async (credentials) => {
    const result = await authApi.logIn(credentials);
    acceptSession(result.session, result.user);
    return result.user;
  }, [acceptSession]);

  const signUp = useCallback(async (payload) => {
    const result = await authApi.signUp(payload);
    acceptSession(result.session, result.user);
    return result.user;
  }, [acceptSession]);

  const signOut = useCallback(async () => {
    try { await authApi.logOut(); } catch { /* Clear the local session even if the API is unavailable. */ }
    localStorage.removeItem('crewensia.session');
    setUser(null);
  }, []);

  const switchRole = useCallback(async (role) => {
    const { data } = await api.patch('/me/active-role', { role });
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const addRole = useCallback(async (payload) => {
    const { data } = await api.post('/me/roles', payload);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const value = useMemo(() => ({ user, ready, signIn, signUp, signOut, switchRole, addRole, setUser }), [user, ready, signIn, signUp, signOut, switchRole, addRole]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
