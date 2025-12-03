

export interface BlogPost {
  _id: string;
  name: string;
  info: string;
  author: string;
  tags: string[];
  createdDate?: string;
  date?: string;
  likes: number;
  image: string;
  content?: string;
  isPrivate?: boolean;
  iframeUrl?: string;
  code?: string;
  code2?: string;
  codeGroup?: string;
  user?: User;
}

export interface Photo {
  _id: string;
  url: string;
  name?: string;      // Backend field
  caption?: string;   // Legacy support
  createdDate?: string; // Backend field
  date?: string;      // Legacy support
  location?: string;
  order?: number;
}

export interface User {
  _id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  token?: string;
  vip?: boolean;
  private_token?: string;
  date?: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  target: string;
  targetId?: string;
  operator?: User;
  details?: any;
  createdDate: string;
  ipAddress?: string;
  status?: string;
  message?: string; // From socket event
}

export interface Project {
  _id: string;
  name: string;
  info: string;
  link: string;
  image: string;
  likes?: number;
}

export interface ResumeItem {
  _id: string;
  title: string;
  _title?: string;
  info: string;
  _info?: string;
  degree?: string;
  url?: string;
}

export interface Log {
  _id: string;
  version: string;
  date: string;
  content: string;
}

export interface Reply {
  id: string;
  user: User;
  content: string;
  date: string;
  photoURL?: string;
  targetUser?: User;
}

export interface Comment {
  _id: string;
  id: string;
  user: User;
  comment: string;
  date: string;
  photoURL?: string;
  reply: Reply[];
  _postid: string;
  _userid?: string;
}

export interface Todo {
  _id: string;
  todo: string;
  done: boolean;
  timestamp: number;
}

// Fitness Types (Refactored)
export interface FitnessBody {
  weight?: number; // kg
}

export interface FitnessWorkout {
  isDone: boolean;
  duration?: number; // min
  types?: string[]; // Array of strings e.g. ["Running", "Chest"]
  note?: string;
}

export interface FitnessDiet {
  content?: string; // "Bread for breakfast..."
  water?: number; // ml or cups
}

export interface FitnessStatus {
  mood?: 'happy' | 'neutral' | 'bad';
  sleepHours?: number;
}

export interface FitnessRecord {
  _id?: string;
  user?: User | string; // Can be ID or populated object
  date?: string; 
  dateStr?: string; // YYYY-MM-DD
  body?: FitnessBody;
  workout?: FitnessWorkout;
  diet?: FitnessDiet; // Changed from nutrition
  status?: FitnessStatus; // New field
  photos?: string[];
  targetUserEmail?: string; // For submission only
}

export interface FitnessStats {
  dates: string[];
  weights: (number | null)[];
  durations: number[];
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark'
}

export type Language = 'en' | 'zh';

export enum PageView {
  HOME = 'HOME',
  BLOG = 'BLOG',
  ARTICLE = 'ARTICLE',
  RESUME = 'RESUME',
  PRIVATE_SPACE = 'PRIVATE_SPACE',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS',
  CHAT = 'CHAT',
  AUDIT_LOG = 'AUDIT_LOG',
  ARCHIVES = 'ARCHIVES'
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationData;
}

// Chat Types
export interface ChatUser {
  id: string;
  name: string;
  socketId?: string;
}

export interface ChatMessage {
  message: string;
  author: string;
  userId?: string;
  room?: string;
  timestamp?: string;
  isPrivate?: boolean;
  isSystem?: boolean;
  receiver?: string;
}
