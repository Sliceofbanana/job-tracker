import { Timestamp } from "firebase/firestore";

export interface JobEntry {
  id: string;
  uid: string;
  company: string;
  role: string;
  link: string;
  notes: string;
  status: string;
  salary?: string;
  interviewDate?: string;
  companyResearch?: string;
  applicationTemplate?: string;
  createdAt?: Timestamp;
  tags?: string[];
  priority?: 'high' | 'medium' | 'low';
  location?: string;
  isRemote?: boolean;
  isFavorite?: boolean;
  followUpDate?: string;
  applicationDate?: string;
  responseDate?: string;
  companySize?: string;
  industry?: string;
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship';
}

export interface ApplicationTemplate {
  name: string;
  tips: string;
  keySkills: string[];
  coverLetterHint: string;
}

export interface Stats {
  total: number;
  applied: number;
  interviewing: number;
  offers: number;
  rejected: number;
  avgSalary: number;
  responseRate: number;
  avgDaysToResponse: number;
  weeklyGoal: number;
  weeklyProgress: number;
  successRate: number;
}

export interface Notification {
  id: string;
  type: 'interview' | 'followup' | 'deadline' | 'achievement';
  title: string;
  message: string;
  date: Date;
  jobId?: string;
  isRead: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'application' | 'interview' | 'followup' | 'deadline';
  jobId: string;
  description?: string;
  color: 'blue' | 'yellow' | 'purple' | 'green' | 'red';
}
