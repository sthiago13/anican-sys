import React from 'react';
import { ActionIcon, type ActionIconProps } from '@mantine/core';

export interface IconButtonProps extends ActionIconProps, Omit<React.ComponentPropsWithoutRef<'button'>, keyof ActionIconProps> {
  icon: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, color = 'gray', variant = 'subtle', size = 'md', ...props }, ref) => {
    return (
      <ActionIcon
        ref={ref}
        color={color}
        variant={variant}
        size={size}
        radius="xl"
        styles={{
          root: {
            transition: 'transform 0.15s ease, background-color 0.2s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
          },
        }}
        {...props}
      >
        {icon}
      </ActionIcon>
    );
  }
);

IconButton.displayName = 'IconButton';
