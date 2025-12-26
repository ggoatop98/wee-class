
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, writeBatch, type QuerySnapshot, type Firestore } from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  signup: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<any>;
  updateCurrentUserPassword: (currentPass: string, newPass: string) => Promise<void>;
  deleteCurrentUserAccount: (currentPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to delete documents in batches
async function deleteInBatches(db: Firestore, querySnapshot: QuerySnapshot) {
  const batchSize = 500;
  const docs = querySnapshot.docs;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = docs.slice(i, i + batchSize);
    chunk.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = (email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
  };

  const logout = () => {
    return signOut(auth);
  };
  
  const updateCurrentUserPassword = async (currentPass: string, newPass: string) => {
    if (!user) {
      throw new Error("사용자가 로그인되어 있지 않습니다.");
    }
    const credential = EmailAuthProvider.credential(user.email!, currentPass);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPass);
  };
  
  const deleteCurrentUserAccount = async (currentPass: string) => {
    if (!user) {
        throw new Error("사용자가 로그인되어 있지 않습니다.");
    }

    const credential = EmailAuthProvider.credential(user.email!, currentPass);
    await reauthenticateWithCredential(user, credential);
    
    const userId = user.uid;

    try {
        // Firestore 데이터 삭제 (in batches)
        const collectionsToDelete = ["students", "appointments", "counselingLogs", "caseConceptualizations", "psychologicalTests", "parentApplications", "teacherReferrals", "studentApplications", "todos"];
        for (const coll of collectionsToDelete) {
            const q = query(collection(db, coll), where("userId", "==", userId));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                await deleteInBatches(db, snapshot);
            }
        }
        
        // Storage 데이터 삭제
        const storageFolderRef = ref(storage, `student_files/${userId}`);
        const res = await listAll(storageFolderRef);
        for (const folderRef of res.prefixes) {
            const studentFilesRes = await listAll(folderRef);
            await Promise.all(studentFilesRes.items.map((itemRef) => deleteObject(itemRef)));
        }

        // Firebase Auth에서 사용자 삭제
        await deleteUser(user);

        toast({
            title: "성공",
            description: "계정이 성공적으로 삭제되었습니다.",
        });
        
        router.push('/login');

    } catch (error) {
        console.error("계정 삭제 중 오류 발생: ", error);
        throw new Error("계정 삭제 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };


  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateCurrentUserPassword,
    deleteCurrentUserAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
