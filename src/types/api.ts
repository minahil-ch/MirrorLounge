// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  error?: string;
  errors?: ValidationError[];
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface FirebaseError {
  code: string;
  message: string;
  customData?: Record<string, unknown>;
}

// Service Response Types
export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}

export interface BulkOperationResult {
  successful: number;
  failed: number;
  errors: string[];
  data?: Record<string, unknown>[];
}

// Import/Export Types
export interface ImportValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
  rowCount: number;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json';
  fields?: string[];
  filters?: Record<string, string | number | boolean>;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Search and Filter Types
export interface SearchParams {
  query?: string;
  filters?: Record<string, string | number | boolean>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface FilterOption {
  label: string;
  value: string | number | boolean;
  count?: number;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated?: string;
}

export interface FormState<T = unknown> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
}

// Component Props Types
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface TableColumn<T = unknown> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface TableProps<T = unknown> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (row: T) => void;
}

// Authentication Types
export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

// File Upload Types
export interface FileUploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

// Analytics Types
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, string | number | boolean>;
  timestamp?: string;
  userId?: string;
}

export interface MetricData {
  label: string;
  value: number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  format?: 'number' | 'currency' | 'percentage';
}