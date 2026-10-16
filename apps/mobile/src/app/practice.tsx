import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';

import { BrandButton } from '@/components/brand-button';
import { ExerciseCard } from '@/components/exercise-card';
import { SponsoredSlot } from '@/components/sponsored-slot';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FeedbackColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { buildSession, checkAnswer, retryOf, type Exercise, type Verdict } from '@/lib/exercises';
import { useLibrary } from '@/state/library';
import { useSponsor } from '@/state/sponsor';

const SESSION_LENGTH = 5;

export default function PracticeScreen() {
  const { collectionId } = useLocalSearchParams<{ collectionId?: string }>();
  const { ready } = useLibrary();
  // The session is built once from the loaded library, so wait for it.
  if (!ready) return null;
  return <Session collectionId={collectionId} />;
}

function Session({ collectionId }: { collectionId?: string }) {
  const { collections, recordAnswer } = useLibrary();
  const { sponsor } = useSponsor();
  const [queue, setQueue] = useState<Exercise[]>(() =>
    buildSession(collectionId ? collections.filter((c) => c.id === collectionId) : collections, SESSION_LENGTH),
  );
  const [firstRound] = useState(queue.length);
  const [index, setIndex] = useState(0);
  const [given, setGiven] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);

  if (queue.length === 0) {
    return (
      <Centered>
        <ThemedText themeColor="textSecondary" style={styles.centerText}>
          Nothing to practise yet. Add words with translations to a collection first.
        </ThemedText>
        <BrandButton title="Back" onPress={close} />
      </Centered>
    );
  }

  if (index >= queue.length) {
    return (
      <ThemedView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.doneBadge, { backgroundColor: sponsor.primary }]}>
            <ThemedText style={[styles.doneIcon, { color: sponsor.onPrimary }]}>✓</ThemedText>
          </View>
          <ThemedText style={styles.doneTitle}>Session complete</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.centerText}>
            {firstTryCorrect} of {firstRound} right on the first try
          </ThemedText>
          <ThemedText style={styles.centerText}>{sponsor.completionMessage}</ThemedText>
          <SponsoredSlot />
          <BrandButton title="Done" onPress={close} />
        </ScrollView>
      </ThemedView>
    );
  }

  const exercise = queue[index];

  const submit = (answer: string) => {
    const result = checkAnswer(exercise, answer);
    setGiven(answer);
    setVerdict(result);
    recordAnswer(exercise.collectionId, exercise.word.id, result.correct);
    if (result.correct && index < firstRound) setFirstTryCorrect((n) => n + 1);
    // A missed word comes back at the end: the session ends only when every word is answered right.
    if (!result.correct) setQueue((q) => [...q, retryOf(exercise)]);
  };

  const next = () => {
    setIndex((i) => i + 1);
    setGiven(null);
    setVerdict(null);
  };

  return (
    <ThemedView style={styles.screen}>
      <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedView type="backgroundSelected" style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${(index / queue.length) * 100}%`, backgroundColor: sponsor.primary },
              ]}
            />
          </ThemedView>

          <ExerciseCard key={index} exercise={exercise} given={given} onSubmit={submit} />

          {verdict && (
            <View style={styles.feedback}>
              <ThemedText
                type="smallBold"
                style={{ color: verdict.correct ? FeedbackColors.correct : FeedbackColors.wrong }}>
                {verdict.correct ? 'Correct!' : `Answer: ${exercise.answer}`}
              </ThemedText>
              {verdict.note && <ThemedText type="small">{verdict.note}</ThemedText>}
              <ThemedText type="small" themeColor="textSecondary">
                {exercise.word.term} = {exercise.word.translation}
              </ThemedText>
              <BrandButton title="Continue" onPress={next} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

function Centered({ children }: { children: ReactNode }) {
  return <ThemedView style={[styles.screen, styles.centered]}>{children}</ThemedView>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
  content: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  feedback: {
    gap: Spacing.two,
  },
  doneBadge: {
    alignSelf: 'center',
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  doneIcon: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: 800,
  },
  doneTitle: {
    textAlign: 'center',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 800,
  },
});
