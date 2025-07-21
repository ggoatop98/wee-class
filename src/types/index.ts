
import type { Timestamp } from 'firebase/firestore';

export type StudentStatus = '상담중' | '종결';

export interface Student {
  id: string;
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
  studentId: string;
  studentName:string;
  counselingDate: string; // yyyy-MM-dd
  counselingTime: string; // HH:mm
  mainIssues: string;
  counselingGoals?: string;
  sessionContent?: string;
  therapistComments?: string;
  nextSessionGoals?: string;
  createdAt: Timestamp;
}
