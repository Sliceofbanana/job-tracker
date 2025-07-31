// utils/addJob.ts
import { db } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export interface JobFormData {
  company: string;
  role: string;
  link: string;
  notes: string;
}

export const defaultForm: JobFormData = {
  company: "",
  role: "",
  link: "",
  notes: "",
};
