// NextAuth Type Extensions
import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
  }

  interface Session {
    user: {
        id: string;
        role: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}

// Business and Location Types
export interface Business {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  email?: string;
  contactPage?: string;
  hasContactForm?: boolean;
  formsCount?: number;
  formUrls?: string[]; // URLs of detected contact forms
  crawlStatus?: "pending" | "success" | "error" | "no-forms";
  crawlError?: string;
  rating?: number;
  reviews?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: string[];
  category: string;
  prefecture?: string;
  area?: string;
  station?: string;
  tags?: string[];
  location?: {
    lat: number;
    lng: number;
  };
  distance?: number; // Distance in kilometers from search coordinates
  placeId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Location {
  city: string;
  state?: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Search Configuration
export interface SearchConfig {
  location: Location;
  category: string;
  radius: number;
  keywords?: string;
}

// Form Types
export interface ContactForm {
  id: string;
  url: string;
  businessName: string;
  fields: FormField[];
  status: "pending" | "filled" | "submitted" | "error";
  error?: string;
  submittedAt?: Date;
}

export interface FormField {
  name: string;
  type: "text" | "email" | "textarea" | "select" | "checkbox" | "radio";
  selector: string;
  value?: string;
  required: boolean;
  placeholder?: string;
}

// Advertisement Content
export interface AdvertisementContent {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject: string;
  message: string;
  website?: string;
}

// Crawler Types
export interface CrawlResult {
  url: string;
  businessName: string;
  formsFound: ContactForm[];
  status: "success" | "error" | "no-forms" | "submitted";
  error?: string;
  crawlTime: number;
}

// CAPTCHA Types
export interface CaptchaChallenge {
  type: "recaptcha" | "hcaptcha" | "simple" | "image";
  selector: string;
  siteKey?: string;
  challenge?: string;
}

// Rate Limiting
export interface RateLimitConfig {
  delay: number;
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SearchResponse {
  businesses: Business[];
  totalFound: number;
  nextPageToken?: string;
}

// Tokyo Area Search Types
export interface SearchMetrics {
  totalAreas: number;
  areasSearched: number;
  totalBusinesses: number;
  searchTime: number; // in milliseconds
  averageTimePerArea: number;
  businessesPerMinute: number;
  apiCalls: number;
  errors: string[];
}

export interface CrawlResponse {
  results: CrawlResult[];
  totalProcessed: number;
  totalFormsFound: number;
  totalSubmitted: number;
  totalErrors: number;
}

// Dashboard Types
export interface DashboardStats {
  totalSearches: number;
  totalBusinesses: number;
  totalFormsFound: number;
  totalSubmissions: number;
  successRate: number;
  averageResponseTime: number;
  totalLists: number;
  activeLists: number;
  completedLists: number;
}

// Business List Types
export interface BusinessList {
  id: string;
  name: string;
  description?: string;
  status: "ACTIVE" | "ARCHIVED" | "DELETED";
  createdAt: Date;
  updatedAt: Date;
  businessCount: number;
}

// Step Types
export interface Step {
  id: string;
  stepNumber: number;
  stepType: StepType;
  title: string;
  description: string;
  status: StepStatus;
  data?: Record<string, unknown>;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type StepType =
  | "LEGAL_RESEARCH"
  | "TECHNICAL_DESIGN"
  | "GOOGLE_MAPS_SETUP"
  | "DATA_STORAGE"
  | "WEB_SCRAPING"
  | "CONTACT_DETECTION"
  | "FORM_ANALYSIS"
  | "AUTO_FILL"
  | "CAPTCHA_HANDLING"
  | "FORM_SUBMISSION"
  | "SYSTEM_INTEGRATION"
  | "QUALITY_ASSURANCE"
  | "TESTING"
  | "MONITORING"
  | "DOCUMENTATION"
  | "DEPLOYMENT";

export type StepStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED"
  | "SKIPPED";

// User Action Types
export interface UserAction {
  id: string;
  action: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Configuration Types
export interface AppConfig {
  googleMapsApiKey: string;
  rateLimit: RateLimitConfig;
  browser: {
    headless: boolean;
    timeout: number;
    userAgent: string;
  };
  captcha: {
    enabled: boolean;
    service?: string;
    apiKey?: string;
  };
}

// Cache Types
export interface CacheEntry {
  key: string;
  age: number;
}

export interface CacheStats {
  size: number;
  entries: CacheEntry[];
}

// Contact Page Detection Types
export interface ContactPageDetection {
  id: string;
  businessContactId: string;
  website: string;
  detectedPages: DetectedContactPage[];
  status: "pending" | "in_progress" | "completed" | "failed";
  confidence: number;
  totalPagesChecked: number;
  detectionTime: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DetectedContactPage {
  url: string;
  title: string;
  confidence: number;
  detectionMethod: "pattern" | "ai" | "manual";
  hasContactForm: boolean;
  hasContactInfo: boolean;
  pageType: "contact" | "about" | "support" | "inquiry" | "other";
  contentSummary?: string;
  verified: boolean;
  verifiedAt?: Date;
}

export interface ContactPageDetectionRequest {
  businessContactId: string;
  website: string;
  businessName: string;
  forceRefresh?: boolean;
}

export interface ContactPageDetectionResponse {
  success: boolean;
  data?: ContactPageDetection;
  error?: string;
  message?: string;
}

export interface BatchDetectionRequest {
  businessContactIds: string[];
  forceRefresh?: boolean;
}

export interface BatchDetectionResponse {
  success: boolean;
  data: {
    total: number;
    completed: number;
    failed: number;
    results: ContactPageDetection[];
  };
  error?: string;
}

// Contact Group Types
export interface ContactGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    items: number;
  };
  items?: ContactGroupItem[];
}

export interface BusinessContact {
  id: string;
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  email?: string;
  contactPage?: string;
  rating?: number;
  reviews?: number;
  user_ratings_total?: number;
  price_level?: number;
  types: string[];
  category: string;
  region?: string;
  area?: string;
  station?: string;
  coordinates: { lat: number; lng: number };
  status: string;
  isVerified: boolean;
  lastSearched: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactGroupItem {
  id: string;
  groupId: string;
  businessContactId: string;
  addedAt: string;
  notes?: string;
  messagingEnabled?: boolean; // Whether messaging is enabled for this contact
  lastMessageSent?: string; // When the last message was sent to this contact
  lastMessageFailed?: string; // When the last message failed to send
  lastFailureReason?: string; // Reason for the last failure
  business?: BusinessContact; // Changed from businessContact to business to match API response
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  color?: string;
}

export interface AddToGroupRequest {
  groupId: string;
  businessContactIds: string[];
  notes?: string;
}

export interface BulkAddToGroupRequest {
  groupId: string;
  businessContactIds: string[];
  notes?: string;
}

export interface GroupApiResponse {
  success: boolean;
  data?: ContactGroup | ContactGroup[];
  message?: string;
  error?: string;
}

export interface BulkAddResponse {
  success: boolean;
  data: {
    added: number;
    alreadyExists: number;
    errors: number;
    details?: Array<{ businessContactId: string; error: string }>;
  };
  message?: string;
  error?: string;
}
