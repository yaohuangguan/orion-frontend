
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
  // 🔥🔥🔥 New: Fitness Goal & Height
  fitnessGoal?: 'cut' | 'bulk' | 'maintain';
  height?: number; // cm
  // 🛡️ Role Management
  role?: 'user' | 'admin' | 'super_admin' | 'bot';
  // 🔐 Permissions
  permissions?: string[];
}

// --- PERMISSIONS CONFIG ---
export const PERM_KEYS = {
  // --- User Basis ---
  USER_UPDATE: 'user:update_self',
  BLOG_INTERACT: 'blog:interact',

  // --- Private Domain ---
  PRIVATE_ACCESS: 'private_domain:access',
  
  // --- Private Logs ---
  PRIVATE_POST_USE: 'private_post:use',
  PRIVATE_POST_READ: 'private_post:read',

  // --- Second Brain ---
  BRAIN_USE: 'brain:use',

  // --- Capsule Gallery ---
  CAPSULE_USE: 'capsule:use',

  // --- Leisure Space ---
  LEISURE_READ: 'leisure:read',
  LEISURE_MANAGE: 'leisure:manage',

  // --- Fitness Space ---
  FITNESS_USE: 'fitness:use',       // Self check-in
  FITNESS_READ_ALL: 'fitness:read_all', // Admin View
  FITNESS_EDIT_ALL: 'fitness:edit_all', // Admin Edit

  // --- System/Logs (Top Secret) ---
  SYSTEM_LOGS: 'system:logs',
  USER_MANAGE: 'system:user_manage', // Implied for managing users
};

/**
 * Check if a user has a specific permission.
 */
export const can = (user: User | null | undefined, permission: string): boolean => {
  if (!user || !user.permissions) return false;
  // 1. Super Admin Wildcard
  if (user.permissions.includes('*')) return true;
  // 2. Exact Match
  return user.permissions.includes(permission);
};

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

export interface PermissionRequest {
  _id: string;
  user: User;
  permission: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  createdAt: string;
}

export interface Project {
  _id: string;
  name: string;
  info: string;
  link: string;
  image: string;
  likes?: number;
}

// New Portfolio Project Model
export interface PortfolioProject {
  _id: string;
  title_zh: string;
  title_en: string;
  summary_zh?: string;
  summary_en?: string;
  description_zh?: string;
  description_en?: string;
  techStack: string[];
  repoUrl?: string;
  demoUrl?: string;
  coverImage?: string;
  order: number;
  isVisible: boolean;
  createdAt: string;
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

// New Resume Model
export interface ResumeData {
  _id: string;
  basics: {
    name_zh?: string;
    name_en?: string;
    label_zh?: string;
    label_en?: string;
    email?: string;
    phone?: string;
    location_zh?: string;
    location_en?: string;
    summary_zh?: string;
    summary_en?: string;
  };
  education: Array<{
    institution?: string;
    location?: string;
    area_zh?: string;
    area_en?: string;
    studyType_zh?: string;
    studyType_en?: string;
    startDate?: string;
    endDate?: string;
    score_zh?: string;
    score_en?: string;
  }>;
  work: Array<{
    company_zh?: string;
    company_en?: string;
    position_zh?: string;
    position_en?: string;
    startDate?: string;
    endDate?: string;
    highlights_zh?: string[];
    highlights_en?: string[];
  }>;
  skills: Array<{
    name_zh?: string;
    name_en?: string;
    keywords: string[];
  }>;
  languages: Array<{
    language_zh?: string;
    language_en?: string;
    fluency_zh?: string;
    fluency_en?: string;
  }>;
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

// Updated Bucket List / Todo Model
export interface Todo {
  _id: string;
  todo: string; // The Title
  description?: string;
  status?: 'todo' | 'in_progress' | 'done';
  type?: 'wish' | 'routine'; // New Type Field
  images?: string[];
  targetDate?: string;
  order?: number;
  done: boolean; // Legacy field for compatibility
  timestamp: number | string;
  create_date?: string;
  complete_date?: string;
  user?: User; // Added user field
}

// Period / Cycle Types
export interface PeriodRecord {
  _id?: string;
  startDate: string; // ISO Date String
  endDate?: string;  // ISO Date String
  duration?: number;
  cycleLength?: number;
  symptoms?: string[];
  flow?: 'light' | 'medium' | 'heavy';
  note?: string;
  operator?: string; // ID of the user who logged this record
}

export interface PeriodResponse {
  records: PeriodRecord[];
  avgCycle: number;
  avgDuration: number;
  lastStart: string;
  prediction: {
    nextPeriodStart: string;
    ovulationDate: string;
    fertileWindow: {
      start: string;
      end: string;
    };
    desc: string;
  };
}

// Fitness Types (Refactored)
export interface FitnessBody {
  weight?: number; // kg
  bmi?: number;
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
  bmis: (number | null)[]; // Added BMI
  durations: number[];
  water: (number | null)[];
  sleep: (number | null)[];
}

// --- Footprint (Map/Travel) Types ---
export interface FootprintLocation {
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  name: string; // POI name
  address?: string;
  coordinates: [number, number]; // [lng, lat]
  adcode?: string;
}

export interface Footprint {
  _id: string;
  user: User;
  location: FootprintLocation;
  content?: string;
  images?: string[];
  rating?: number;
  mood?: 'happy' | 'excited' | 'peaceful' | 'tired' | 'sad' | 'romantic' | 'adventurous';
  cost?: number;
  visitDate: string;
  status: 'visited' | 'planned';
  isHighlight?: boolean;
}

export interface FootprintStats {
  totalCount: number;
  countries: string[];
  provinces: string[];
  citiesCount: number;
}

// --- Menu / Chef's Wheel Types ---
export interface Menu {
  _id: string;
  name: string;
  category: string; // '午餐', '晚餐', etc.
  tags: string[];
  image?: string;
  timesEaten: number;
  lastEaten?: string;
  isActive: boolean;
  weight: number; // 1-10
  caloriesLevel: 'low' | 'medium' | 'high';
  createdAt?: string;
}

export interface DrawResponse {
  winner: Menu;
  pool: Menu[];
  meta: any;
}

// --- Smart Menu Recommendation Types ---
export interface SmartMenuDish {
  name: string;
  tags: string[];
  calories_estimate: string;
  reason: string;
}

export interface SmartMenuResponse {
  success: boolean;
  based_on: {
    weight: number | null;
    goal: string;
    source: 'fitness_record' | 'user_profile';
  };
  recommendation: {
    nutrition_advice: string;
    dishes: SmartMenuDish[];
  };
}

// --- Hot Search & News Types ---
export interface HotSearchItem {
  title: string;
  url: string;
  hot?: string;
  googleUrl?: string; // Backend provides googleUrl
  index?: number;
}

// Unified API Response
export type DailyListType = 'hotsearch' | 'finance' | 'game' | 'guonei' | 'world';

export interface DailyListResponse {
  type: DailyListType;
  date: string;
  list: HotSearchItem[];
  source: string;
}

// Keeping aliases for compatibility if needed, but implementation uses DailyListResponse
export type HotSearchResponse = DailyListResponse;
export type FinanceNewsResponse = DailyListResponse;

// --- Cloudinary Usage Types ---
export interface CloudinaryUsage {
  plan: string;
  last_updated: string;
  transformations: { usage: number; credits_usage: number; };
  objects: { usage: number; };
  bandwidth: { usage: number; credits_usage: number; };
  storage: { usage: number; credits_usage: number; };
  credits: { usage: number; limit: number; used_percent: number; };
  requests: number;
  resources: number;
  derived_resources: number;
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
  RESUME = 'RESUME', // Now maps to PortfolioPage
  PRIVATE_SPACE = 'PRIVATE_SPACE',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS',
  SYSTEM = 'SYSTEM', // New System Management Page
  CHAT = 'CHAT',
  AUDIT_LOG = 'AUDIT_LOG',
  ARCHIVES = 'ARCHIVES', // Deprecated, but keeping enum to avoid breaks if any
  FOOTPRINT = 'FOOTPRINT' // New Page
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
  email?: string;
  socketId?: string;
}

export interface ChatMessage {
  message: string;
  author: string;
  userId?: string;
  email?: string;
  photoURL?: string;
  room?: string;
  timestamp?: string;
  isPrivate?: boolean;
  isSystem?: boolean;
  receiver?: string;
}