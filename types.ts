// Fix: Import `ComponentType` to resolve missing React namespace.
import type { ComponentType } from 'react';

export type View = 'Dashboard' | 'Projects' | 'About' | 'Contact';

export interface Skill {
  name: string;
  proficiency: number;
  icon?: ComponentType<{ className?: string }>;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  liveUrl: string;
  sourceUrl: string;
}
