export interface FilterChip {
  key: string;
  label: string;
  value: string;
}

export interface EmptyStateModel {
  title: string;
  description: string;
  actionLabel?: string;
}

export interface LoadingStateModel {
  message?: string;
}

export interface ErrorStateModel {
  title: string;
  message: string;
  retryLabel?: string;
}

export { default as PageHeader } from "./PageHeader";
export { default as StatCard } from "./StatCard";
