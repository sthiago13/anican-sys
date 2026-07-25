import React from 'react';
import { ActionIcon, Group, type ActionIconProps } from '@mantine/core';

export interface IconButtonProps extends ActionIconProps, Omit<React.ComponentPropsWithoutRef<'button'>, keyof ActionIconProps> {
  icon: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, color = 'gray', variant = 'subtle', size = 'md', children, style, ...props }, ref) => {
    return (
      <ActionIcon
        ref={ref}
        color={color}
        variant={variant}
        size={size}
        radius="xl"
        style={{
          width: children ? 'auto' : undefined,
          paddingLeft: children ? 14 : undefined,
          paddingRight: children ? 16 : undefined,
          ...style,
        }}
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
        <Group gap={6} wrap="nowrap" align="center">
          {icon}
          {children}
        </Group>
      </ActionIcon>
    );
  }
);

IconButton.displayName = 'IconButton';
