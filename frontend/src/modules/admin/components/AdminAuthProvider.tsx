import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { adminLogin } from '../api/admin.api';
import { ADMIN_STORAGE_KEYS } from '../constants/admin-storage.constants';
import { AdminAuthContext } from '../hooks/admin-auth-context';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(ADMIN_STORAGE_KEYS.ACCESS_TOKEN),
  );

  const login = useCallback(async (password: string) => {
    const accessToken = await adminLogin(password);
    localStorage.setItem(ADMIN_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    setToken(accessToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_STORAGE_KEYS.ACCESS_TOKEN);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
