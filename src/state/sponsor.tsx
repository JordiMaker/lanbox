import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { HOUSE_SPONSOR, SPONSORS, type Sponsor } from '@/constants/sponsors';

const STORAGE_KEY = 'lanbox.sponsor.v1';

type SponsorState = {
  ready: boolean;
  sponsor: Sponsor;
  /** Demo only: lets you preview the app under each sponsor's brand. */
  selectSponsor: (id: string) => void;
};

const SponsorContext = createContext<SponsorState | null>(null);

export function SponsorProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [sponsorId, setSponsorId] = useState(HOUSE_SPONSOR.id);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((id) => {
        if (id) setSponsorId(id);
      })
      .catch((error) => console.warn('Could not load sponsor', error))
      .finally(() => setReady(true));
  }, []);

  const state: SponsorState = {
    ready,
    sponsor: SPONSORS.find((s) => s.id === sponsorId) ?? HOUSE_SPONSOR,
    selectSponsor: (id) => {
      setSponsorId(id);
      AsyncStorage.setItem(STORAGE_KEY, id).catch((error) => console.warn('Could not save sponsor', error));
    },
  };

  return <SponsorContext value={state}>{children}</SponsorContext>;
}

export function useSponsor() {
  const state = use(SponsorContext);
  if (!state) throw new Error('useSponsor must be used inside SponsorProvider');
  return state;
}
