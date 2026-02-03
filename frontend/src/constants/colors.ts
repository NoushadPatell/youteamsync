// Brand color constants for easy reference
export const COLORS = {
  brand: {
    dark: '#384959',
    main: '#6A89A7',
    light: '#88BDF2',
    pale: '#BDDDFC',
  },
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#8B5CF6',
  },
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    700: '#374151',
    900: '#111827',
  },
} as const;

// Status color mappings
export const STATUS_COLORS = {
  draft: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
    border: 'border-neutral-300',
    label: 'DRAFT',
  },
  editing: {
    bg: 'bg-brand-pale',
    text: 'text-brand-dark',
    border: 'border-brand-light',
    label: 'IN PROGRESS',
  },
  review: {
    bg: 'bg-warning-light',
    text: 'text-warning-dark',
    border: 'border-warning-DEFAULT',
    label: 'IN REVIEW',
  },
  approved: {
    bg: 'bg-info-light',
    text: 'text-info-dark',
    border: 'border-info-DEFAULT',
    label: 'APPROVED',
  },
  published: {
    bg: 'bg-success-light',
    text: 'text-success-dark',
    border: 'border-success-DEFAULT',
    label: 'PUBLISHED',
  },
} as const;

// Task status colors
export const TASK_COLORS = {
  assigned: {
    bg: 'bg-warning-light',
    text: 'text-warning-dark',
    icon: 'text-warning-DEFAULT',
  },
  in_progress: {
    bg: 'bg-brand-pale',
    text: 'text-brand-dark',
    icon: 'text-brand',
  },
  completed: {
    bg: 'bg-success-light',
    text: 'text-success-dark',
    icon: 'text-success',
  },
} as const;

// Role colors
export const ROLE_COLORS = {
  video_editor: {
    gradient: 'from-brand to-brand-light',
    bg: 'bg-brand-pale',
    text: 'text-brand-dark',
    border: 'border-brand-light',
  },
  thumbnail_designer: {
    gradient: 'from-info-DEFAULT to-info-dark',
    bg: 'bg-info-light',
    text: 'text-info-dark',
    border: 'border-info-DEFAULT',
  },
  metadata_manager: {
    gradient: 'from-success-DEFAULT to-success-dark',
    bg: 'bg-success-light',
    text: 'text-success-dark',
    border: 'border-success-DEFAULT',
  },
} as const;