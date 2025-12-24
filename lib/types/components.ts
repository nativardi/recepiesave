// Description: Shared component prop types and interfaces

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

/**
 * Common props for components with children
 */
export interface WithChildren {
  children: ReactNode;
}

/**
 * Common props for components with optional className
 */
export interface WithClassName {
  className?: string;
}

/**
 * Common props for components with loading state
 */
export interface WithLoading {
  isLoading?: boolean;
}

/**
 * Common props for components with error state
 */
export interface WithError {
  error?: string | null;
  onRetry?: () => void;
}

/**
 * Common props for icon components
 */
export interface IconProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
}

/**
 * Common props for card components
 */
export interface CardProps extends WithClassName {
  onClick?: () => void;
  href?: string;
  isActive?: boolean;
  isDisabled?: boolean;
}

/**
 * Common props for input components
 */
export interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

/**
 * Common props for button components
 */
export interface ButtonProps extends WithClassName, WithChildren {
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

/**
 * Props for components that handle async operations
 */
export interface AsyncOperationProps {
  onSubmit: (data: unknown) => Promise<void>;
  onSuccess?: (result: unknown) => void;
  onError?: (error: Error) => void;
}

/**
 * Props for pagination components
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
}

/**
 * Props for empty state components
 */
export interface EmptyStateProps extends WithClassName {
  icon?: LucideIcon;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Props for modal/dialog components
 */
export interface ModalProps extends WithChildren {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg" | "full";
}

/**
 * Props for list item components
 */
export interface ListItemProps extends WithClassName {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  thumbnail?: string;
  rightAction?: ReactNode;
  onClick?: () => void;
}

/**
 * Props for header/navigation components
 */
export interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  className?: string;
}

/**
 * Props for filter/search components
 */
export interface FilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  filters?: Array<{
    id: string;
    label: string;
    active: boolean;
  }>;
  onFilterChange?: (filterId: string) => void;
}

/**
 * Props for skeleton loader components
 */
export interface SkeletonProps extends WithClassName {
  count?: number;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

/**
 * Props for form field components
 */
export interface FormFieldProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Generic props for data display components
 */
export interface DataDisplayProps<T> {
  data: T;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  emptyMessage?: string;
  className?: string;
}

/**
 * Props for components with actions/menu
 */
export interface WithActions {
  actions?: Array<{
    id: string;
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    variant?: "default" | "danger";
    disabled?: boolean;
  }>;
}

/**
 * Props for tabs component
 */
export interface TabsProps {
  tabs: Array<{
    id: string;
    label: string;
    content: ReactNode;
    icon?: LucideIcon;
    disabled?: boolean;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

/**
 * Props for badge/chip components
 */
export interface BadgeProps extends WithChildren, WithClassName {
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  onRemove?: () => void;
}

/**
 * Utility type to make all handlers optional
 */
export type OptionalHandlers<T> = {
  [K in keyof T as K extends `on${string}` ? K : never]?: T[K];
} & {
  [K in keyof T as K extends `on${string}` ? never : K]: T[K];
};

/**
 * Utility type to extract handler props
 */
export type Handlers<T> = {
  [K in keyof T as K extends `on${string}` ? K : never]: T[K];
};

/**
 * Utility type for polymorphic component props
 */
export type PolymorphicProps<E extends React.ElementType, P = {}> = P & Omit<React.ComponentPropsWithoutRef<E>, keyof P> & {
  as?: E;
};
