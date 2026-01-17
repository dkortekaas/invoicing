'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Project {
  id: string;
  name: string;
  color?: string;
  customer?: {
    name: string;
  };
}

interface ProjectSelectProps {
  value?: string;
  onChange: (value: string) => void;
  customerId?: string;
}

export function ProjectSelect({ value, onChange, customerId }: ProjectSelectProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const NONE_VALUE = '__none__';

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const url = customerId
          ? `/api/projects?customerId=${customerId}&archived=false`
          : '/api/projects?archived=false';
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error('Load projects error:', error);
      }
    };

    loadProjects();
  }, [customerId]);

  // Convert empty string to special value for Select
  const selectValue = value && value !== '' ? value : NONE_VALUE;

  const handleValueChange = (newValue: string) => {
    // Convert special value back to empty string
    onChange(newValue === NONE_VALUE ? '' : newValue);
  };

  return (
    <Select value={selectValue} onValueChange={handleValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecteer project (optioneel)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>Geen project</SelectItem>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            <div className="flex items-center gap-2">
              {project.color && (
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
              )}
              <span>{project.name}</span>
              {project.customer && (
                <span className="text-xs text-muted-foreground">
                  ({project.customer.name})
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
