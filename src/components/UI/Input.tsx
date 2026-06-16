import React from 'react';
import { TextInput, type TextInputProps } from '@mantine/core';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, variant = 'default', radius = 'md', ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        label={label}
        error={error}
        variant={variant}
        radius={radius}
        styles={{
          input: {
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            '&:focus': {
              borderColor: 'var(--mantine-color-orange-filled)',
            },
          },
          label: {
            fontWeight: 600,
            marginBottom: 4,
          },
        }}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
