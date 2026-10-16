/**
 * A sponsor's brand is applied across the app: header colour, buttons, the
 * home hero, the end-of-session message and the sponsored slot.
 *
 * The demo sponsors are fictional and let you preview the app for a client.
 * In production the active sponsor will come from the backend campaign.
 */
export type Sponsor = {
  id: string;
  name: string;
  tagline: string;
  /** Short monogram shown until logo images are supported. */
  monogram: string;
  primary: string;
  onPrimary: string;
  /** Shown when the learner finishes a session. */
  completionMessage: string;
  cta?: { label: string; url: string };
};

export const HOUSE_SPONSOR: Sponsor = {
  id: 'lanbox',
  name: 'LANBOX',
  tagline: 'Learn your own words',
  monogram: 'LB',
  primary: '#208AEF',
  onPrimary: '#FFFFFF',
  completionMessage: 'Nice work. See you at the next unlock.',
};

export const SPONSORS: Sponsor[] = [
  HOUSE_SPONSOR,
  {
    id: 'acme-coffee',
    name: 'Acme Coffee',
    tagline: 'Fuel for fluent minds',
    monogram: 'AC',
    primary: '#6F4E37',
    onPrimary: '#FFF8F0',
    completionMessage: 'Session complete. Time for a coffee break.',
    cta: { label: 'Find a café', url: 'https://example.com/acme-coffee' },
  },
  {
    id: 'northwind-travel',
    name: 'Northwind Travel',
    tagline: 'Words that take you further',
    monogram: 'NT',
    primary: '#0F766E',
    onPrimary: '#F0FDFA',
    completionMessage: "You're one step closer to your next trip.",
    cta: { label: 'Explore destinations', url: 'https://example.com/northwind' },
  },
];
