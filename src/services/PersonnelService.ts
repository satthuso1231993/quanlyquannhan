import { db, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, onSnapshot } from '../lib/localDb';
import { PersonnelProfile } from '../types/military';

export const PersonnelService = {
  async getAll(): Promise<PersonnelProfile[]> {
    const querySnapshot = await getDocs(collection(db, 'profiles'));
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as PersonnelProfile));
  },

  async save(profile: Partial<PersonnelProfile>): Promise<string> {
    const id = profile.id;
    const now = new Date().toISOString();
    const updatedProfile = { ...profile, updatedAt: now };

    if (id) {
      await updateDoc(doc(db, 'profiles', id), updatedProfile);
      return id;
    } else {
      const docRef = await addDoc(collection(db, 'profiles'), { ...updatedProfile, createdAt: now });
      return docRef.id;
    }
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'profiles', id));
  }
};
