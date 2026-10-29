import { CalendarDays, Landmark, Users, type LucideIcon } from 'lucide-react';

/**
 * Describes everything an organiser can edit. ContentManager + SettingsManager read this
 * file and draw the lists and forms, so adding a field later is a one-line change here
 * (plus a column in supabase/schema.sql).
 */
export type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'list' | 'image' | 'select' | 'relation';

export interface FieldDef {
  name: string; // database column
  label: string;
  type: FieldType;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  help?: string;
  options?: Array<{ value: string; label: string }>; // for 'select'
  relation?: { table: string; labelField: string; orderBy: string }; // for 'relation'
  half?: boolean; // render at half width on desktop
}

export interface ResourceDef {
  key: string;
  table: string;
  title: string;
  singular: string;
  description: string;
  icon: LucideIcon;
  titleField: string;
  subtitleField?: string;
  metaFields?: string[];
  groupBy?: { field: string; table: string; labelField: string; orderBy: string };
  fields: FieldDef[];
  defaults: Record<string, unknown>;
  published: boolean; // has an is_published column
}

export const ICON_OPTIONS = [
  { value: 'shield', label: 'Shield' },
  { value: 'eye', label: 'Eye' },
  { value: 'lock', label: 'Lock' },
  { value: 'activity', label: 'Activity' },
  { value: 'landmark', label: 'Landmark' },
];

export const RESOURCES: ResourceDef[] = [
  {
    key: 'committees',
    table: 'committees',
    title: 'Councils',
    singular: 'council',
    description: 'The committees delegates can choose. They appear in the horizontal scroll and in the registration form.',
    icon: Landmark,
    titleField: 'name',
    subtitleField: 'topic',
    metaFields: ['code', 'level', 'seats'],
    published: true,
    defaults: {
      code: '',
      name: '',
      icon: 'shield',
      topic: 'Topic TBA',
      level: 'TBA',
      seats: 'Seats TBA',
      charter: '',
      focus_questions: [],
      key_countries: [],
      background_overview: '',
      is_published: true,
    },
    fields: [
      { name: 'code', label: 'Short code', type: 'text', required: true, maxLength: 60, half: true, placeholder: 'Council I', help: 'Also used as the value in the registration form.' },
      { name: 'name', label: 'Full name', type: 'text', required: true, maxLength: 160, half: true, placeholder: 'Security Council' },
      { name: 'icon', label: 'Icon', type: 'select', options: ICON_OPTIONS },
      { name: 'level', label: 'Level', type: 'text', maxLength: 60, half: true, placeholder: 'Advanced' },
      { name: 'seats', label: 'Seats', type: 'text', maxLength: 60, half: true, placeholder: '45 seats' },
      { name: 'topic', label: 'Agenda / topic', type: 'text', maxLength: 300 },
      { name: 'charter', label: 'Charter / mandate', type: 'textarea', maxLength: 2000 },
      { name: 'background_overview', label: 'Background guide overview', type: 'textarea', maxLength: 3000 },
      { name: 'focus_questions', label: 'Focus questions', type: 'list', help: 'One per line.' },
      { name: 'key_countries', label: 'Key countries / allotments', type: 'list', help: 'One per line.' },
    ],
  },
  {
    key: 'schedule_days',
    table: 'schedule_days',
    title: 'Schedule days',
    singular: 'day',
    description: 'The big day headings of the conference timeline.',
    icon: CalendarDays,
    titleField: 'day_label',
    subtitleField: 'day_theme',
    published: true,
    defaults: { day_number: 1, day_label: '', day_theme: '', is_published: true },
    fields: [
      { name: 'day_number', label: 'Day number', type: 'number', required: true, half: true },
      { name: 'day_label', label: 'Label', type: 'text', required: true, maxLength: 40, half: true, placeholder: 'DAY 01' },
      { name: 'day_theme', label: 'Theme / subtitle', type: 'text', maxLength: 200, placeholder: 'Opening & Committee Sessions' },
    ],
  },
  {
    key: 'schedule_events',
    table: 'schedule_events',
    title: 'Schedule events',
    singular: 'event',
    description: 'Individual sessions inside each day.',
    icon: CalendarDays,
    titleField: 'title',
    subtitleField: 'description',
    metaFields: ['time_label', 'location'],
    groupBy: { field: 'day_id', table: 'schedule_days', labelField: 'day_label', orderBy: 'sort_order' },
    published: true,
    defaults: { day_id: '', time_label: 'TBA', title: '', location: '', description: '', badge: '', is_published: true },
    fields: [
      { name: 'day_id', label: 'Day', type: 'relation', required: true, relation: { table: 'schedule_days', labelField: 'day_label', orderBy: 'sort_order' } },
      { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 160, placeholder: 'Opening Ceremony' },
      { name: 'time_label', label: 'Time', type: 'text', maxLength: 60, half: true, placeholder: '09:00 – 10:30' },
      { name: 'badge', label: 'Badge (optional)', type: 'text', maxLength: 40, half: true, placeholder: 'Plenary' },
      { name: 'location', label: 'Location', type: 'text', maxLength: 160, placeholder: 'Main Hall' },
      { name: 'description', label: 'Description', type: 'textarea', maxLength: 600 },
    ],
  },
  {
    key: 'secretariat',
    table: 'secretariat',
    title: 'Secretariat',
    singular: 'member',
    description: 'The High Secretariat cards, with portrait, quote and bio.',
    icon: Users,
    titleField: 'name',
    subtitleField: 'role',
    published: true,
    defaults: { name: '', role: '', image_url: '', quote: '', bio: '', is_confirmed: true, object_position: 'center', is_published: true },
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 120, half: true },
      { name: 'role', label: 'Role', type: 'text', required: true, maxLength: 120, half: true, placeholder: 'Secretary-General' },
      { name: 'image_url', label: 'Portrait', type: 'image', help: 'PNG, JPG or WebP, up to 15 MB.' },
      { name: 'object_position', label: 'Photo focus', type: 'text', maxLength: 40, half: true, placeholder: 'center 30%', help: 'CSS object-position, e.g. "center 30%" to move the crop up/down.' },
      { name: 'is_confirmed', label: 'Confirmed (gold ring)', type: 'boolean', half: true },
      { name: 'quote', label: 'Quote', type: 'textarea', maxLength: 600 },
      { name: 'bio', label: 'Bio', type: 'textarea', maxLength: 2000 },
    ],
  },
];

export const getResource = (key: string) => RESOURCES.find((r) => r.key === key)!;

/* ----------------------------------------------------------- site settings */
export interface SettingDef {
  key: string;
  label: string;
  kind: 'text' | 'email' | 'url' | 'toggle' | 'date';
  group: string;
  help?: string;
  placeholder?: string;
}

export const SETTINGS: SettingDef[] = [
  { key: 'conference_date', label: 'Conference date', kind: 'date', group: 'Conference information', help: 'Optional. Sets the public countdown when confirmed.' },
  { key: 'venue_name', label: 'Venue name', kind: 'text', group: 'Conference information', placeholder: 'Venue to be announced' },
  { key: 'venue_address', label: 'Venue address', kind: 'text', group: 'Conference information', placeholder: 'Full address (optional)' },
  { key: 'delegate_guide_url', label: 'Delegate guide link', kind: 'url', group: 'Conference information', placeholder: 'https://…', help: 'Optional. Link to the published delegate guide.' },
  { key: 'venue', label: 'Venue & location', kind: 'text', group: 'Contact details', placeholder: 'Riyadh, Saudi Arabia', help: 'Shown in the footer. Leave empty to show "TBA".' },
  { key: 'contact_email', label: 'Contact email', kind: 'email', group: 'Contact details', placeholder: 'secretariat@example.com' },
  { key: 'contact_phone', label: 'Phone / contact', kind: 'text', group: 'Contact details', placeholder: '+966 …' },
  { key: 'instagram_url', label: 'Instagram', kind: 'url', group: 'Social links', placeholder: 'https://instagram.com/…', help: 'Empty = icon stays inactive.' },
  { key: 'linkedin_url', label: 'LinkedIn', kind: 'url', group: 'Social links', placeholder: 'https://linkedin.com/…' },
  { key: 'twitter_url', label: 'X / Twitter', kind: 'url', group: 'Social links', placeholder: 'https://x.com/…' },
  { key: 'telegram_url', label: 'Telegram', kind: 'url', group: 'Social links', placeholder: 'https://t.me/…' },
];

export const APPLICATION_STATUSES = [
  { value: 'new', label: 'New', tone: 'blue' as const },
  { value: 'reviewing', label: 'Reviewing', tone: 'amber' as const },
  { value: 'accepted', label: 'Accepted', tone: 'green' as const },
  { value: 'waitlisted', label: 'Waitlisted', tone: 'gold' as const },
  { value: 'rejected', label: 'Rejected', tone: 'red' as const },
];

export const DELEGATION_LABELS: Record<string, string> = {
  single: 'Single delegate',
  double: 'Double delegate',
  head: 'Head delegate',
};

export const TRACK_LABELS: Record<string, string> = {
  delegate: 'Delegates',
  volunteer: 'Volunteers',
  security: 'Security',
  media: 'Media',
};
