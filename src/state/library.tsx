import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { SAMPLE_COLLECTION } from '@/constants/sample';
import { parseWordList } from '@/lib/parse';
import { review } from '@/lib/srs';
import type { Collection, Word, WordEntry } from '@/lib/types';

const STORAGE_KEY = 'lanbox.library.v1';

type NewCollection = Pick<Collection, 'name' | 'learningLang' | 'nativeLang'> & { entries: WordEntry[] };

type Library = {
  ready: boolean;
  collections: Collection[];
  addCollection: (input: NewCollection) => Collection;
  deleteCollection: (id: string) => void;
  recordAnswer: (collectionId: string, wordId: string, correct: boolean) => void;
};

const LibraryContext = createContext<Library | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          setCollections(JSON.parse(raw));
        } else {
          const { text, ...rest } = SAMPLE_COLLECTION;
          setCollections([createCollection({ ...rest, entries: parseWordList(text) })]);
        }
      })
      .catch((error) => console.warn('Could not load library', error))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(collections)).catch((error) =>
      console.warn('Could not save library', error),
    );
  }, [ready, collections]);

  const library: Library = {
    ready,
    collections,
    addCollection: (input) => {
      const collection = createCollection(input);
      setCollections((current) => [collection, ...current]);
      return collection;
    },
    deleteCollection: (id) => {
      setCollections((current) => current.filter((c) => c.id !== id));
    },
    recordAnswer: (collectionId, wordId, correct) => {
      setCollections((current) =>
        current.map((c) =>
          c.id !== collectionId
            ? c
            : { ...c, words: c.words.map((w) => (w.id === wordId ? review(w, correct) : w)) },
        ),
      );
    },
  };

  return <LibraryContext value={library}>{children}</LibraryContext>;
}

export function useLibrary() {
  const library = use(LibraryContext);
  if (!library) throw new Error('useLibrary must be used inside LibraryProvider');
  return library;
}

function createCollection({ entries, ...rest }: NewCollection): Collection {
  const now = Date.now();
  return {
    ...rest,
    id: newId(),
    createdAt: now,
    words: entries.map((entry): Word => ({ ...entry, id: newId(), box: 0, dueAt: now, seen: 0, correct: 0 })),
  };
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
