import { createContext, useContext, useEffect, useState } from "react";
import { Api, Storage } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [patient, setPatient] = useState(Storage.getPatient());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Storage.getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    Api.validateSession()
      .then((res) => {
        Storage.setPatient(res.patient);
        setPatient(res.patient);
      })
      .catch(() => {
        Storage.clearAll();
        setPatient(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (patientId, name) => {
    const result = await Api.login(patientId, name);
    Storage.setToken(result.token);
    Storage.setPatient(result.patient);
    setPatient(result.patient);
    return result.patient;
  };

  const logout = () => {
    Api.logout().catch(() => {});
    Storage.clearAll();
    setPatient(null);
  };

  return (
    <AuthContext.Provider value={{ patient, loading, login, logout, isAuthenticated: !!patient }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
