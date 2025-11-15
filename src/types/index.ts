
import type { Timestamp } from 'firebase/firestore';

export type StudentStatus = '상담중' | '종결';

export interface Student {
  id: string;
  userId: string;
  name: string;
  class: string;
  gender: '남' | '여';
  requester?: '학생' | '학부모' | '교사' | '기타';
  status: StudentStatus;
  contact?: string;
  counselingField?: string;
  memo?: string;
  createdAt: Timestamp;
}

export type AppointmentType = '개인상담' | '집단상담' | '학부모상담' | '교원자문' | '기타';


export interface Appointment {
  id: string;
  userId: string;
  title: string;
  studentId: string;
  studentName: string;
  date: string; // ISO string for date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: AppointmentType;
  repeatSetting: string;
  repeatCount?: number;
  memo?: string;
  excludedDates?: string[]; // Array of 'yyyy-MM-dd' strings
}

export interface CounselingLog {
  id: string;
  userId: string;
  studentId: string;
  studentName:string;
  counselingDate: string; // yyyy-MM-dd
  counselingTime: string; // HH:mm
  counselingDuration?: number; // in minutes
  mainIssues: string;
  counselingGoals?: string;
  sessionContent?: string;
  therapistComments?: string;
  nextSessionGoals?: string;
  createdAt: Timestamp;
}

export interface CaseConceptualization {
    id: string;
    userId: string;
    studentId: string;
    studentName: string;
    content: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface PsychologicalTest {
    id: string;
    userId: string;
    studentId: string;
    studentName: string;
    testName: string;
    testDate: string; // yyyy-MM-dd
    testTime?: string; // HH:mm
    results: string; // Can be rich text
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Todo {
  id: string;
  userId: string;
  task: string;
  isCompleted: boolean;
  createdAt: Timestamp;
}

// This type is now for files listed directly from Firebase Storage.
// 'id' can be the file name or path.
export interface UploadedFile {
  id: string; // Using file name as ID
  fileName: string;
  downloadURL: string;
  storagePath: string;
  fileSize?: number; // Size might not be readily available, making it optional
  fileType?: string; // Type might not be readily available, making it optional
  uploadedAt?: Timestamp; // Not available from Storage listAll, making it optional
}

export type CombinedRecordType = '상담' | '심리검사';

export interface CombinedRecord {
    id: string;
    studentId: string;
    studentName: string;
    date: string;
    time?: string;
    type: CombinedRecordType;
    originalId: string;
    details: string; // For display, e.g., counseling main issues or test name
    duration?: number;
}
