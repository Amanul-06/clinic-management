import { createContext, useState } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (email, password, role) => {
    if (!email.trim() || !password.trim()) {
      return { success: false, message: "Please enter your credentials." };
    }

    setUser({
      id: role === "superadmin" ? "ADM-0001" : "REC-0001",
      name: role === "superadmin" ? "Super Admin" : "Receptionist",
      email,
      role,
    });

    return { success: true };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
