import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../utils/api';

export type UserRole = 'admin' | 'hospital' | 'donor';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  hospitalId?: string;
  donorId?: string;
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  role: UserRole | null;
  roleData: any | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roleData, setRoleData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (): Promise<UserProfile | null> => {
    try {
      const response = await api.get('/auth/me');
      const user = response.data.user as UserProfile;
      setProfile(user);
      setRoleData(response.data.profile);
      return user;
    } catch (err: any) {
      console.warn('Could not fetch user profile from server:', err.message);
      setProfile(null);
      setRoleData(null);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await fetchProfile();
      } else {
        setProfile(null);
        setRoleData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, pass: string): Promise<UserProfile | null> => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      const userProfile = await fetchProfile();
      return userProfile;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setRoleData(null);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        role: profile?.role || null,
        roleData,
        loading,
        login,
        logout,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
