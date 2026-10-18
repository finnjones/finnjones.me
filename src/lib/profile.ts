import profileData from '../../data/profile.json';

export interface Social {
  label: string;
  handle?: string;
  url: string;
}

export interface Metric {
  value?: number;
  text?: string;
  prefix?: string;
  suffix?: string;
  label: string;
  mono?: string;
}

export interface Skill {
  symbol: string;
  name: string;
  trend: 'up' | 'down' | 'flat';
}

export interface Capability {
  label: string;
  items: string[];
}

export interface ExperienceEntry {
  role: string;
  company: string;
  location?: string;
  start: string;
  end: string;
  datesPlaceholder?: boolean;
  highlights: string[];
}

export interface EducationEntry {
  degree: string;
  institution: string;
  start: string;
  end: string;
  datesPlaceholder?: boolean;
}

export interface ProjectMetric {
  value: string;
  label: string;
}

export type CoverKind = 'image' | 'code' | 'chart' | 'signal';

export interface Project {
  slug: string;
  symbol: string;
  title: string;
  year: string;
  role: string;
  summary: string;
  tech: string[];
  problem: string;
  approach: string;
  outcome: string;
  metrics: ProjectMetric[];
  link: string | null;
  repo: string | null;
  image: string | null;
  cover: CoverKind;
  featured: boolean;
}

export interface Profile {
  name: string;
  headline: string;
  positioning: string;
  subheadline: string;
  location: string;
  timezone: string;
  email: string;
  linkedin: string;
  github: string;
  status: { available: boolean; label: string; detail: string };
  socials: Social[];
  about: string[];
  metrics: Metric[];
  skills: Skill[];
  capabilities: Capability[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: Project[];
}

export const profile = profileData as Profile;

export const projects = profile.projects;

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

/** Ordered list for prev/next ledger navigation on case-study pages. */
export function adjacentProjects(slug: string): { prev: Project; next: Project } {
  const i = projects.findIndex((p) => p.slug === slug);
  const prev = projects[(i - 1 + projects.length) % projects.length];
  const next = projects[(i + 1) % projects.length];
  return { prev, next };
}

export default profile;
