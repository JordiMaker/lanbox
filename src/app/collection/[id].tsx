import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { BrandButton } from '@/components/brand-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FeedbackColors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { getLanguage } from '@/lib/languages';
import { isDue, isLearned, isPracticable, MAX_BOX } from '@/lib/srs';
import type { Collection, Word } from '@/lib/types';
import { useLibrary } from '@/state/library';
import { useSponsor } from '@/state/sponsor';

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { collections } = useLibrary();
  const collection = collections.find((c) => c.id === id);

  if (!collection) {
    return (
      <ThemedView style={[styles.screen, styles.centered]}>
        <ThemedText themeColor="textSecondary">This collection no longer exists.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <Stack.Screen options={{ title: collection.name }} />
      <FlatList
        data={collection.words}
        keyExtractor={(word) => word.id}
        renderItem={({ item }) => <WordRow word={item} />}
        ListHeaderComponent={<Summary collection={collection} />}
        ListFooterComponent={<DeleteButton collectionId={collection.id} />}
        contentContainerStyle={styles.list}
      />
    </ThemedView>
  );
}

function Summary({ collection }: { collection: Collection }) {
  const now = useNow();
  const { words } = collection;
  const due = words.filter((w) => isDue(w, now)).length;
  const learned = words.filter(isLearned).length;
  const practicable = words.filter(isPracticable).length;
  const untranslated = words.length - practicable;

  return (
    <View style={styles.summary}>
      <ThemedText type="small" themeColor="textSecondary">
        {getLanguage(collection.learningLang).name} → {getLanguage(collection.nativeLang).name}
      </ThemedText>
      <View style={styles.stats}>
        <Stat label="Words" value={words.length} />
        <Stat label="Learned" value={learned} />
        <Stat label="To review" value={due} />
      </View>
      <BrandButton
        title="Practise this collection"
        disabled={practicable === 0}
        onPress={() => router.push({ pathname: '/practice', params: { collectionId: collection.id } })}
      />
      {untranslated > 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          {untranslated} word{untranslated === 1 ? '' : 's'} still need a translation.
        </ThemedText>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <ThemedView type="backgroundElement" style={styles.stat}>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </ThemedView>
  );
}

function WordRow({ word }: { word: Word }) {
  return (
    <View style={styles.word}>
      <View style={styles.wordText}>
        <ThemedText type="smallBold" style={styles.term}>
          {word.term}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {word.translation || 'Needs a translation'}
        </ThemedText>
      </View>
      <BoxMeter box={word.box} />
    </View>
  );
}

/** How well a word is known: one dot per Leitner box reached. */
function BoxMeter({ box }: { box: number }) {
  const { sponsor } = useSponsor();
  return (
    <View style={styles.meter} accessibilityLabel={`Level ${box} of ${MAX_BOX}`}>
      {Array.from({ length: MAX_BOX }, (_, i) => (
        <ThemedView
          key={i}
          type="backgroundSelected"
          style={[styles.dot, i < box && { backgroundColor: sponsor.primary }]}
        />
      ))}
    </View>
  );
}

function DeleteButton({ collectionId }: { collectionId: string }) {
  const { deleteCollection } = useLibrary();
  const [confirming, setConfirming] = useState(false);

  return (
    <View style={styles.footer}>
      <BrandButton
        variant="secondary"
        title={confirming ? 'Tap again to delete' : 'Delete collection'}
        onPress={() => {
          if (!confirming) return setConfirming(true);
          router.back();
          deleteCollection(collectionId);
        }}
      />
      {confirming && (
        <ThemedText type="small" style={[styles.warning, { color: FeedbackColors.wrong }]}>
          This removes the collection and its progress.
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  summary: {
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  stat: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 700,
  },
  word: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  wordText: {
    flex: 1,
  },
  term: {
    fontSize: 16,
  },
  meter: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    marginTop: Spacing.five,
    gap: Spacing.two,
  },
  warning: {
    textAlign: 'center',
  },
});
