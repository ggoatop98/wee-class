
import type { Timestamp } from 'firebase/firestore';

export interface Student {
  id: string;
  name: string;
  class: string;
  gender: '남' | '여';
  contact?: string;
  email?: string;
  counselingField?: string;
  memo?: string;
}

export interface Appointment {
  id: string;
  title: string;
  studentId: string;
  studentName: string;
  date: string; // ISO string for date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: '상담' | '검사' | '자문' | '교육' | '연구' | '의뢰';
  repeatSetting: string;
  repeatCount?: number;
  counselingLogExists: boolean;
  memo?: string;
}

export interface CounselingLog {
  id: string;
  studentId: string;
  appointmentId?: string;
  counselingDate: string; // ISO string for date
  counselingTime: string; // HH:mm
  counselingDetails: string;
  counselingOpinion?: string;
}
