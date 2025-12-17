
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
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
        const batch = writeBatch(db);

        // Firestore 데이터 삭제
        const collectionsToDelete = ["students", "appointments", "counselingLogs", "caseConceptualizations", "psychologicalTests", "todos"];
        for (const coll of collectionsToDelete) {
            const q = query(collection(db, coll), where("userId", "==", userId));
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
        }
        
        // Storage 데이터 삭제
        const storageFolderRef = ref(storage, `student_files/${userId}`);
        const res = await listAll(storageFolderRef);
        // listAll은 하위 폴더의 파일까지 모두 가져오지 않으므로, 각 학생 폴더를 순회해야 합니다.
        for (const folderRef of res.prefixes) {
            const studentFilesRes = await listAll(folderRef);
            await Promise.all(studentFilesRes.items.map((itemRef) => deleteObject(itemRef)));
        }

        await batch.commit();

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
