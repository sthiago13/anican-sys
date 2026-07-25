import React from 'react';

export type FilterType = 'select' | 'date-parts' | 'date-range' | 'number-range' | 'boolean';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: FilterType;
  icon?: React.ReactNode;
  options?: FilterOption[];
  placeholder?: string;
  defaultValue?: any;
}
