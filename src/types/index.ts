
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
  counselingField?: '해당없음' | '일반관심군' | '우선관심군'; // 정서행동특성검사 결과
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

export type CounselingMethod = '면담' | '전화상담' | '사이버상담';

export interface CoCounselee {
    id: string;
    name: string;
}

export type CounselingDivision = '진로' | '성격' | '대인관계' | '가정 및 가족관계' | '일탈 및 비행' | '학교폭력 가해' | '학교폭력 피해' | '자해 및 자살' | '정신건강' | '컴퓨터 및 스마트폰 과사용' | '정보제공' | '기타';

export interface CounselingLog {
  id: string;
  userId: string;
  studentId: string;
  studentName:string;
  counselingDate: string; // yyyy-MM-dd
  counselingTime: string; // HH:mm
  counselingDuration?: number; // in minutes
  counselingMethod?: CounselingMethod;
  isAdvisory?: boolean; // 자문 여부
  isParentCounseling?: boolean; // 학부모상담 여부
  advisoryField?: '학교학습' | '사회성발달' | '정서발달' | '진로발달' | '행동발달' | '기타';
  counselingDivision?: CounselingDivision;
  mainIssues: string;
  counselingGoals?: string;
  sessionContent?: string;
  therapistComments?: string;
  nextSessionGoals?: string;
  createdAt: Timestamp;
  coCounselees?: CoCounselee[];
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

export interface ParentApplication {
    id: string;
    userId: string;
    studentId: string;
    studentName: string;
    content: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface TeacherReferral {
    id: string;
    userId: string;
    studentId: string;
    studentName: string;
    content: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface StudentApplication {
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
    testDuration?: number; // in minutes
    testMethod?: CounselingMethod;
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

export type CombinedRecordType = '상담' | '검사' | '자문';

export interface CombinedRecord {
    id: string;
    studentId: string;
    studentName: string;
    date: string;
    time?: string;
    type: CombinedRecordType;
    middleCategory?: string;
    counselingDivision?: CounselingDivision | '기타' | '학생관련상담' | '개인심리검사' | string;
    originalId: string;
    details: string; // For display, e.g., counseling main issues or test name
    duration?: number;
    counselingMethod?: CounselingMethod;
    isAdvisory?: boolean;
    isParentCounseling?: boolean;
    coCounselees?: CoCounselee[];
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  commentCount: number;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Timestamp;
}
