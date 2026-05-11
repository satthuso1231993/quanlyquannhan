// Mock Firebase behavior with LocalStorage for GitHub Pages offline-only use

// LocalStorage Backend Mock

export const db = {};

let currentUser: any = null;
let authListeners: any[] = [];

export const auth = {
  get currentUser() { return currentUser; },
};

export const onAuthStateChanged = (authInstance: any, callback: any) => {
  const listener = (e: any) => {
    callback(currentUser);
  };
  authListeners.push(listener);
  // initial call
  setTimeout(() => callback(currentUser), 10);
  return () => {
    authListeners = authListeners.filter((l) => l !== listener);
  };
};

function triggerAuthChange() {
  authListeners.forEach(l => l());
}

export const signInWithPopup = async (authInstance: any, provider: any) => {
  throw new Error("Local offline mode does not support Google Login");
};

export const GoogleAuthProvider = class {};

export const signOut = async (authInstance: any) => {
  currentUser = null;
  localStorage.removeItem('vms_current_user');
  triggerAuthChange();
};

export const signInWithEmailAndPassword = async (authInstance: any, email: string, pass: string) => {
  const res = await fetch('/api/db/auth_users');
  const users = await res.json();
  const user = users.find((u: any) => u.email === email && u.password === pass);
  if (!user) {
    throw new Error('Đăng nhập thất bại. Sai tài khoản hoặc mật khẩu.');
  }
  currentUser = user;
  localStorage.setItem('vms_current_user', JSON.stringify(currentUser));
  triggerAuthChange();
};

export const createUserWithEmailAndPassword = async (authInstance: any, email: string, pass: string) => {
  const res = await fetch('/api/db/auth_users');
  const users = await res.json();

  if (users.find((u: any) => u.email === email)) {
    const error: any = new Error('auth/email-already-in-use');
    error.code = 'auth/email-already-in-use';
    throw error;
  }
  
  const user = {
    email,
    password: pass
  };
  
  const addRes = await fetch('/api/db/auth_users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  const added = await addRes.json();
  
  const userAuth = { ...user, uid: added.id };
  
  currentUser = userAuth;
  localStorage.setItem('vms_current_user', JSON.stringify(currentUser));
  triggerAuthChange();
  
  return { user: userAuth };
};

export const updatePassword = async (userInstance: any, newPass: string) => {
  if (currentUser) {
    await fetch(`/api/db/auth_users/${currentUser.uid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPass })
    });
  }
};

(function init() {
  const stored = localStorage.getItem('vms_current_user');
  if (stored) {
    currentUser = JSON.parse(stored);
  }
})();

type Unsubscribe = () => void;

function emitChange(colPath: string) {
  window.dispatchEvent(new Event(`db_change_${colPath}`));
}

export function collection(dbInstance: any, path: string) {
  return { path };
}

export function doc(dbInstance: any, path: string, id?: string) {
  return { path, id: id || Math.random().toString(36).substr(2, 9) };
}

export function query(col: any, ...constraints: any[]) {
  return { ...col, constraints };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  return { type: 'orderBy', field, direction };
}

export function limit(n: number) {
  return { type: 'limit', n };
}

export async function getDocs(queryObj: any) {
  const res = await fetch(`/api/db/${queryObj.path}`);
  const data = await res.json();
  return {
    docs: data.map((d: any) => ({
      id: d.id,
      data: () => d
    }))
  };
}

export async function getDoc(docRef: any) {
  const res = await fetch(`/api/db/${docRef.path}/${docRef.id}`);
  const data = await res.json();
  return {
    exists: () => !!data && Object.keys(data).length > 0,
    id: docRef.id,
    data: () => data
  };
}

export async function setDoc(docRef: any, data: any) {
  await fetch(`/api/db/${docRef.path}/${docRef.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  emitChange(docRef.path);
}

export async function addDoc(col: any, data: any) {
  const res = await fetch(`/api/db/${col.path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  emitChange(col.path);
  return { id: json.id };
}

export async function updateDoc(docRef: any, data: any) {
  await fetch(`/api/db/${docRef.path}/${docRef.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  emitChange(docRef.path);
}

export async function deleteDoc(docRef: any) {
  await fetch(`/api/db/${docRef.path}/${docRef.id}`, {
    method: 'DELETE'
  });
  emitChange(docRef.path);
}

export function onSnapshot(queryObj: any, callback: (snapshot: any) => void, onError?: (err: any) => void): Unsubscribe {
  const fetchAndTrigger = async () => {
    try {
      const res = await fetch(`/api/db/${queryObj.path}`);
      let allData = await res.json();
      
      // Apply basic orderBy constraint if it exists (very naive implementation)
      if (queryObj.constraints) {
        const ob = queryObj.constraints.find((c: any) => c.type === 'orderBy');
        if (ob) {
          allData.sort((a: any, b: any) => {
            if (a[ob.field] < b[ob.field]) return ob.direction === 'asc' ? -1 : 1;
            if (a[ob.field] > b[ob.field]) return ob.direction === 'asc' ? 1 : -1;
            return 0;
          });
        }
        const lm = queryObj.constraints.find((c: any) => c.type === 'limit');
        if (lm) {
          allData = allData.slice(0, lm.n);
        }
      }

      callback({
        docs: allData.map((d: any) => ({
          id: d.id,
          data: () => d
        }))
      });
    } catch (err) {
      if (onError) onError(err);
    }
  };

  fetchAndTrigger();
  const listener = () => fetchAndTrigger();
  window.addEventListener(`db_change_${queryObj.path}`, listener);

  return () => {
    window.removeEventListener(`db_change_${queryObj.path}`, listener);
  };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error("LocalDB Error:", error, operationType, path);
}

