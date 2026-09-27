'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  club: string;
  avatarInitials: string;
}

const DEFAULT_USER: UserProfile = {
  id: 'usr-analyst-1',
  name: 'Ferrel Al',
  email: 'analyst@tactiq.pro',
  role: 'Chief Tactical Analyst',
  club: 'TactIQ Intelligence',
  avatarInitials: 'FA',
};

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: DEFAULT_USER,
  isAuthenticated: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_USER);

  useEffect(() => {
    // Check if user session exists in localStorage
    try {
      const stored = localStorage.getItem('tactiq_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const login = (email: string) => {
    const newUser: UserProfile = {
      ...DEFAULT_USER,
      email,
      name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      avatarInitials: email.slice(0, 2).toUpperCase(),
    };
    setUser(newUser);
    try {
      localStorage.setItem('tactiq_user', JSON.stringify(newUser));
    } catch {
      // Ignore
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('tactiq_user');
    } catch {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
