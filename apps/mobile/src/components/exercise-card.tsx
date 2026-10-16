import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { BrandButton } from '@/components/brand-button';
import { ThemedText } from '@/components/themed-text';
import { FeedbackColors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Exercise } from '@/lib/exercises';
import { getLanguage } from '@/lib/languages';
import { useSponsor } from '@/state/sponsor';

type Props = {
  exercise: Exercise;
  /** The learner's answer once submitted; null while still answering. */
  given: string | null;
  onSubmit: (given: string) => void;
};

/** Renders one exercise. Mount it with a fresh `key` per exercise so local state resets. */
export function ExerciseCard({ exercise, given, onSubmit }: Props) {
  const language = getLanguage(exercise.learningLang);
  const { word, kind } = exercise;
  const speak = () => {
    Speech.stop();
    Speech.speak(word.term, { language: language.speechLocale });
  };

  useEffect(() => {
    if (kind === 'listen') speak();
    return () => {
      Speech.stop();
    };
    // Speak once when the exercise appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.card}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.instruction}>
        {INSTRUCTIONS[kind](language.name)}
      </ThemedText>

      {kind === 'listen' ? (
        <SpeakButton onPress={speak} large />
      ) : (
        <View style={styles.promptRow}>
          <ThemedText style={styles.prompt}>{kind === 'choose-translation' ? word.term : word.translation}</ThemedText>
          {kind === 'choose-translation' && <SpeakButton onPress={speak} />}
        </View>
      )}

      {exercise.options ? (
        <Options options={exercise.options} answer={exercise.answer} given={given} onPick={onSubmit} />
      ) : (
        <TypedAnswer disabled={given !== null} onSubmit={onSubmit} />
      )}
    </View>
  );
}

const INSTRUCTIONS: Record<Exercise['kind'], (language: string) => string> = {
  'choose-translation': () => 'What does this mean?',
  'choose-term': (language) => `How do you say this in ${language}?`,
  'type-term': (language) => `Write this in ${language}`,
  listen: () => 'Listen and pick what you hear',
};

function SpeakButton({ onPress, large }: { onPress: () => void; large?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Play pronunciation"
      onPress={onPress}
      style={({ pressed }) => [
        styles.speak,
        large && styles.speakLarge,
        { backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <ThemedText style={large ? styles.speakIconLarge : undefined}>🔊</ThemedText>
    </Pressable>
  );
}

function Options({
  options,
  answer,
  given,
  onPick,
}: {
  options: string[];
  answer: string;
  given: string | null;
  onPick: (option: string) => void;
}) {
  const theme = useTheme();
  const answered = given !== null;

  return (
    <View style={styles.options}>
      {options.map((option) => {
        const isAnswer = answered && option === answer;
        const isWrongPick = answered && option === given && option !== answer;
        const highlight = isAnswer ? FeedbackColors.correct : isWrongPick ? FeedbackColors.wrong : undefined;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            disabled={answered}
            onPress={() => onPick(option)}
            style={({ pressed }) => [
              styles.option,
              { backgroundColor: theme.backgroundElement, borderColor: highlight ?? 'transparent' },
              answered && !highlight && styles.dimmed,
              pressed && styles.pressed,
            ]}>
            <ThemedText style={highlight && { color: highlight, fontWeight: 700 }}>{option}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function TypedAnswer({ disabled, onSubmit }: { disabled: boolean; onSubmit: (text: string) => void }) {
  const theme = useTheme();
  const { sponsor } = useSponsor();
  const [text, setText] = useState('');
  const submit = () => {
    if (text.trim()) onSubmit(text);
  };

  return (
    <View style={styles.options}>
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={submit}
        editable={!disabled}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        placeholder="Type your answer"
        placeholderTextColor={theme.textSecondary}
        selectionColor={sponsor.primary}
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
      />
      {!disabled && <BrandButton title="Check" onPress={submit} disabled={!text.trim()} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.four,
  },
  instruction: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  prompt: {
    flexShrink: 1,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: 700,
  },
  speak: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakLarge: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  speakIconLarge: {
    fontSize: 40,
    lineHeight: 48,
  },
  options: {
    gap: Spacing.two,
  },
  option: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 2,
  },
  dimmed: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
  input: {
    fontSize: 20,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
  },
});
