import profileData from '../../data/profile.json';

export interface Social {
  label: string;
  handle?: string;
  url: string;
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

export interface GalleryShot {
  image: string; // file in src/assets/work/
  caption: string;
  frame?: 'wide' | 'phone'; // phone = portrait app screen, shown four across
}

export interface Project {
  slug: string;
  title: string;
  year: string;
  role: string;
  summary: string;
  tech: string[];
  problem: string;
  approach: string;
  outcome: string;
  link: string | null;
  repo: string | null;
  image: string | null;
  imageAlt?: string;
  lead: boolean; // shown full width on the home page
  gallery?: GalleryShot[];
}

export interface Profile {
  name: string;
  headline: string;
  description: string;
  intro: string[];
  location: string;
  timezone: string;
  email: string;
  linkedin: string;
  github: string;
  socials: Social[];
  about: string[];
  capabilities: Capability[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: Project[];
}

export const profile = profileData as Profile;

export const projects = profile.projects;

/** Previous and next project, in file order, for the links under a case study. */
export function adjacentProjects(slug: string): { prev: Project; next: Project } {
  const i = projects.findIndex((p) => p.slug === slug);
  const prev = projects[(i - 1 + projects.length) % projects.length];
  const next = projects[(i + 1) % projects.length];
  return { prev, next };
}

/** "2022–2024", with an en dash, the way a year range is written. */
export function years(start: string, end: string): string {
  return start === end ? start : `${start}–${end}`;
}

/** The bare hostname of a URL, used as link text so a link says where it goes. */
export function hostname(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '');
}

/** The live site for a project, or null when its only link is the repository. */
export function liveLink(p: Project): string | null {
  return p.link && p.link !== p.repo ? p.link : null;
}

export default profile;
