import React, { createContext, useState, ReactNode } from 'react';

type AuthContextType = {
  user: string | null;
  token: string | null;
  authenticate: (userId: string, token: string) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  authenticate: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const authenticate = (userId: string, token: string) => {

    console.log('Authenticating:', userId, token); // Debug line
    setUser(userId);
    setToken(token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, authenticate, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
