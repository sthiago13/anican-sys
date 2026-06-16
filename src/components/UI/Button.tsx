import React from 'react';
import { Button as MantineButton, type ButtonProps as MantineButtonProps } from '@mantine/core';

export interface CustomButtonProps extends MantineButtonProps, Omit<React.ComponentPropsWithoutRef<'button'>, keyof MantineButtonProps> {
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ children, color = 'orange', variant = 'filled', ...props }, ref) => {
    return (
      <MantineButton
        ref={ref}
        color={color}
        variant={variant}
        radius="md"
        styles={{
          root: {
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            '&:active': {
              transform: 'scale(0.98)',
            },
          },
        }}
        {...props}
      >
        {children}
      </MantineButton>
    );
  }
);

Button.displayName = 'Button';
