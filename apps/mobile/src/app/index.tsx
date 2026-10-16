import { Link, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BrandButton } from '@/components/brand-button';
import { SponsorHero } from '@/components/sponsor-hero';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { getLanguage } from '@/lib/languages';
import { isDue, isLearned, isPracticable } from '@/lib/srs';
import type { Collection } from '@/lib/types';
import { useNow } from '@/hooks/use-now';
import { useLibrary } from '@/state/library';
import { useSponsor } from '@/state/sponsor';

export default function HomeScreen() {
  const { collections } = useLibrary();
  const now = useNow();
  const words = collections.flatMap((c) => c.words);
  const due = words.filter((w) => isDue(w, now)).length;
  const practicable = words.filter(isPracticable).length;

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <SponsorHero />
        <View style={styles.content}>
          <ThemedView type="backgroundElement" style={styles.sessionCard}>
            <ThemedText type="smallBold">Today&apos;s session</ThemedText>
            <ThemedText style={styles.dueCount}>
              {due > 0 ? `${due} word${due === 1 ? '' : 's'} to review` : 'All caught up'}
            </ThemedText>
            <BrandButton
              title={due > 0 ? 'Start session' : 'Practise anyway'}
              disabled={practicable === 0}
              onPress={() => router.push('/practice')}
            />
          </ThemedView>

          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold">Your collections</ThemedText>
            <BrandButton
              title="+ New"
              variant="secondary"
              style={styles.newButton}
              onPress={() => router.push('/collection/new')}
            />
          </View>

          {collections.length === 0 ? (
            <ThemedText themeColor="textSecondary">
              No collections yet. Paste a list of words to start learning them.
            </ThemedText>
          ) : (
            collections.map((collection) => <CollectionRow key={collection.id} collection={collection} />)
          )}

          <Link href="/sponsor" style={styles.sponsorLink}>
            <ThemedText type="small" themeColor="textSecondary">
              Sponsor preview
            </ThemedText>
          </Link>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function CollectionRow({ collection }: { collection: Collection }) {
  const { sponsor } = useSponsor();
  const total = collection.words.length;
  const learned = collection.words.filter(isLearned).length;
  const learning = getLanguage(collection.learningLang).name;
  const native = getLanguage(collection.nativeLang).name;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/collection/[id]', params: { id: collection.id } })}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.collection}>
        <View style={styles.collectionTitle}>
          <ThemedText type="smallBold" style={styles.collectionName}>
            {collection.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {learned}/{total}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {learning} → {native}
        </ThemedText>
        <ThemedView type="backgroundSelected" style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${total ? (learned / total) * 100 : 0}%`, backgroundColor: sponsor.primary },
            ]}
          />
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    paddingBottom: Spacing.six,
  },
  content: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sessionCard: {
    padding: Spacing.four,
    borderRadius: Radius.large,
    gap: Spacing.two,
  },
  dueCount: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 700,
    marginBottom: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
  },
  newButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  collection: {
    padding: Spacing.three,
    borderRadius: Radius.medium,
    gap: Spacing.one,
  },
  collectionTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  collectionName: {
    flex: 1,
    fontSize: 17,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: Spacing.two,
  },
  progressFill: {
    height: '100%',
  },
  pressed: {
    opacity: 0.7,
  },
  sponsorLink: {
    alignSelf: 'center',
    marginTop: Spacing.four,
  },
});
