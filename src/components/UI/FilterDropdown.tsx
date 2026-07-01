import React from 'react';
import { Menu, Group } from '@mantine/core';
import { IconFilter, IconChevronDown } from '@tabler/icons-react';
import { IconButton } from './IconButton';
import {Button} from './Button';
export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDropdownProps {
  buttonType?: typeof IconButton | typeof Button,  
  label: string;
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  icon?: React.ReactNode;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  buttonType: ButtonComponent = Button,
  label,
  options,
  selectedValue,
  onSelect,
  icon = <IconFilter size={16} stroke={1.5} />,
}) => {
  const selectedOption = options.find((opt) => opt.value === selectedValue);

  return (
    <Menu shadow="md" width={200} transitionProps={{ transition: 'pop-top-right', duration: 150 }}>
      <Menu.Target>
        {ButtonComponent === IconButton ? (
          <IconButton
            icon={icon}
            color="orange"
          />
        ) : (
          <Button
            variant="outline"
            color="orange"
            radius="md"
            leftSection={icon}
            rightSection={<IconChevronDown size={14} stroke={1.5} />}
            styles={{
              root: {
                fontWeight: 500,
              },
            }}
          >
            <Group gap={4}>
              <span>{label}:</span>
              <span style={{ fontWeight: 600 }}>{selectedOption?.label || 'Todos'}</span>
            </Group>
          </Button>
        )}
      </Menu.Target>

      <Menu.Dropdown>
        {options.map((option) => (
          <Menu.Item
            key={option.value}
            onClick={() => onSelect(option.value)}
            style={{
              fontWeight: selectedValue === option.value ? 600 : 400,
              backgroundColor:
                selectedValue === option.value
                  ? 'var(--mantine-color-orange-light)'
                  : undefined,
              color:
                selectedValue === option.value
                  ? 'var(--mantine-color-orange-filled)'
                  : undefined,
            }}
          >
            {option.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};
