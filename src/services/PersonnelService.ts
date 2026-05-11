import { supabase } from '../lib/supabase';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, onSnapshot } from 'firebase/firestore';
import { PersonnelProfile } from '../types/military';

export const PersonnelService = {
  async getAll(): Promise<PersonnelProfile[]> {
    try {
      const { data, error } = await supabase
        .from('personnel')
        .select('*')
        .order('createdAt', { ascending: false });
        
      if (error) {
        console.warn('Supabase fetch error, using Firebase:', error.message);
        throw error;
      }
      return data as PersonnelProfile[];
    } catch (e) {
      // Firebase fallback
      const querySnapshot = await getDocs(collection(db, 'profiles'));
      return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as PersonnelProfile));
    }
  },

  async save(profile: Partial<PersonnelProfile>): Promise<string> {
    const id = profile.id;
    const now = new Date().toISOString();
    const updatedProfile = { ...profile, updatedAt: now };
    
    // Sync to Supabase
    try {
      if (id) {
        const { error } = await supabase.from('personnel').update(updatedProfile).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('personnel').insert([{ ...updatedProfile, createdAt: now }]).select().single();
        if (error) throw error;
        if (data) profile.id = data.id;
      }
    } catch (e: any) {
      console.error('Supabase save failed:', e.message);
    }

    // Sync to Firebase
    if (id) {
      await updateDoc(doc(db, 'profiles', id), updatedProfile);
      return id;
    } else {
      const docRef = await addDoc(collection(db, 'profiles'), { ...updatedProfile, createdAt: now });
      return docRef.id;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await supabase.from('personnel').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete failed', e);
    }
    await deleteDoc(doc(db, 'profiles', id));
  }
};
