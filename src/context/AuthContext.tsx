import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { AppUser, UserRole } from '../types/military';

interface AuthContextType {
  user: any | null; // Can be Firebase User or Supabase User
  appUser: AppUser | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName: string, unit: string) => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Auth listeners starting...");
    
    // 1. Firebase Listener
    const unsubscribeFirebase = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("Firebase Auth state changed:", firebaseUser.email);
        setUser(firebaseUser);
        await syncUser(firebaseUser.uid, firebaseUser.email || '', firebaseUser.displayName || '');
      } else {
        // Only set loading false if no supabase user either
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setUser(null);
          setAppUser(null);
          setLoading(false);
        }
      }
    });

    // 2. Supabase Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Supabase Auth event:", event);
      if (session?.user) {
        setUser(session.user);
        await syncUser(session.user.id, session.user.email || '', session.user.user_metadata?.displayName || '');
      } else if (!auth.currentUser) {
        setUser(null);
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeFirebase();
      subscription.unsubscribe();
    };
  }, []);

  const syncUser = async (uid: string, email: string, displayName: string, unit?: string) => {
    try {
      // Sync to Firebase for legacy support if needed
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      let finalRole: UserRole = 'VIEWER';
      let finalUnit = unit || 'Chưa xác định';

      if (userSnap.exists()) {
        const data = userSnap.data() as AppUser;
        finalRole = data.role;
        finalUnit = data.unit || finalUnit;
      }

      // Check for Admin Emails/Codes
      const adminEmails = ['satthuso1231993@gmail.com', 'admin@vms.vn'];
      const isAdminEmail = adminEmails.includes(email) || email.endsWith('@admin.vms');
      
      if (isAdminEmail) {
        finalRole = 'ADMIN';
      }

      const appUserData: AppUser = {
        uid: uid,
        email: email,
        displayName: displayName || (isAdminEmail ? 'Quản trị viên' : 'Nhân viên'),
        role: finalRole,
        unit: finalUnit
      };

      // Save to both (Dual source for transition)
      await setDoc(userRef, appUserData);
      setAppUser(appUserData);

    } catch (e) {
      console.error("Error syncing user:", e);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    // Try Supabase first, fallback to Firebase
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      console.log("Supabase login success");
    } catch (supabaseError) {
      console.warn("Supabase login failed, trying Firebase:", supabaseError);
      try {
        await signInWithEmailAndPassword(auth, email, pass);
      } catch (firebaseError: any) {
        if (firebaseError.code === 'auth/operation-not-allowed') {
          throw new Error('Đăng nhập bằng Email/Mật khẩu chưa được bật. Vui lòng thêm VITE_SUPABASE_ANON_KEY hoặc bật Sign-in provider trên Firebase.');
        }
        throw firebaseError;
      }
    }
  };

  const registerWithEmail = async (email: string, pass: string, displayName: string, unit: string) => {
    const isAdminEmail = ['satthuso1231993@gmail.com', 'admin@vms.vn'].includes(email);
    
    // Try Supabase register
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: { displayName, unit }
        }
      });
      if (error) throw error;
    } catch (supabaseError: any) {
      console.warn("Supabase register failed, trying Firebase:", supabaseError);
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        const newUser: AppUser = {
          uid: cred.user.uid,
          email: email,
          displayName: displayName,
          role: isAdminEmail ? 'ADMIN' : 'VIEWER',
          unit: unit
        };
        await setDoc(doc(db, 'users', cred.user.uid), newUser);
      } catch (firebaseError: any) {
        if (firebaseError.code === 'auth/email-already-in-use') {
          throw new Error('Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.');
        }
        if (firebaseError.code === 'auth/operation-not-allowed') {
          throw new Error('Đăng nhập bằng Email/Mật khẩu chưa được bật trên Firebase. Hoặc bạn chưa nhập cấu hình VITE_SUPABASE_ANON_KEY cho Supabase.');
        }
        throw firebaseError;
      }
    }
  };

  const changePassword = async (newPass: string) => {
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, newPass);
    } else {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    await supabase.auth.signOut();
  };

  const isAdmin = appUser?.role === 'ADMIN';
  const isStaff = ['ADMIN', 'COMMANDER', 'MANAGER', 'CLERK'].includes(appUser?.role || '');

  return (
    <AuthContext.Provider value={{ 
      user, 
      appUser, 
      loading, 
      login, 
      loginWithEmail,
      registerWithEmail,
      changePassword,
      logout, 
      isAdmin, 
      isStaff 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
