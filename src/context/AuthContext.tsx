import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword, doc, getDoc, setDoc, updateDoc, auth, db } from '../lib/localDb';
import { AppUser, UserRole } from '../types/military';

interface AuthContextType {
  user: any | null; // Firebase User
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
  const [user, setUser] = useState<any | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Auth listeners starting...");
    
    // Firebase Listener
    const unsubscribeFirebase = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("Firebase Auth state changed:", firebaseUser.email);
        setUser(firebaseUser);
        await syncUser(firebaseUser.uid, firebaseUser.email || '', firebaseUser.displayName || '');
      } else {
        setUser(null);
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeFirebase();
    };
  }, []);

  const syncUser = async (uid: string, email: string, displayName: string, unit?: string) => {
    try {
      // Sync to Firebase
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
    // Hardcoded Admin Bypass for testing without backend setup
    if (email === 'admin@admin.vms' && pass === 'admin123') {
      setUser({ uid: 'hardcoded-admin', email: 'admin@admin.vms' } as any);
      setAppUser({
        uid: 'hardcoded-admin',
        email: 'admin@admin.vms',
        displayName: 'Quản trị viên (Offline)',
        role: 'ADMIN',
        unit: 'Ban Chỉ huy'
      });
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (firebaseError: any) {
      if (firebaseError.code === 'auth/operation-not-allowed') {
        throw new Error('Đăng nhập bằng Email/Mật khẩu chưa được bật. Vui lòng bật Sign-in provider trên Firebase Console.');
      }
      throw firebaseError;
    }
  };

  const registerWithEmail = async (email: string, pass: string, displayName: string, unit: string) => {
    const isAdminEmail = ['satthuso1231993@gmail.com', 'admin@vms.vn'].includes(email);
    
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
        throw new Error('Đăng ký bằng Email/Mật khẩu chưa được bật trên Firebase.');
      }
      throw firebaseError;
    }
  };

  const changePassword = async (newPass: string) => {
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, newPass);
    } else {
      throw new Error('Bạn không có quyền thực hiện hành động này.');
    }
  };

  const logout = async () => {
    await signOut(auth);
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
