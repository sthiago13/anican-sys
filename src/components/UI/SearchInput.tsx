import React from 'react';
import { TextInput, type TextInputProps } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

export interface SearchInputProps extends Omit<TextInputProps, 'leftSection'> {
  onSearchChange?: (value: string) => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearchChange, onChange, placeholder = 'Buscar...', radius = 'md', ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(event);
      }
      if (onSearchChange) {
        onSearchChange(event.currentTarget.value);
      }
    };

    return (
      <TextInput
        ref={ref}
        placeholder={placeholder}
        radius={radius}
        leftSection={<IconSearch size={16} stroke={1.5} />}
        onChange={handleChange}
        styles={{
          input: {
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            '&:focus': {
              borderColor: 'var(--mantine-color-orange-filled)',
            },
          },
        }}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';
