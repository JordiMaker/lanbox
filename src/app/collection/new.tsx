import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { BrandButton } from '@/components/brand-button';
import { LanguagePicker } from '@/components/language-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { parseWordList } from '@/lib/parse';
import { useLibrary } from '@/state/library';

const PREVIEW_COUNT = 5;

export default function NewCollectionScreen() {
  const theme = useTheme();
  const { addCollection } = useLibrary();
  const [name, setName] = useState('');
  const [learningLang, setLearningLang] = useState('en');
  const [nativeLang, setNativeLang] = useState('es');
  const [text, setText] = useState('');

  const entries = parseWordList(text);
  const untranslated = entries.filter((e) => !e.translation).length;
  const sameLanguage = learningLang === nativeLang;
  const canSave = entries.length > 0 && !sameLanguage;

  const save = () => {
    const collection = addCollection({ name: name.trim() || 'My words', learningLang, nativeLang, entries });
    router.replace({ pathname: '/collection/[id]', params: { id: collection.id } });
  };

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.screen}>
      <KeyboardAvoidingView behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <ThemedText type="smallBold">Name</ThemedText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Business English"
              placeholderTextColor={theme.textSecondary}
              style={inputStyle}
            />
          </View>

          <LanguagePicker label="I'm learning" value={learningLang} onChange={setLearningLang} />
          <LanguagePicker label="I speak" value={nativeLang} onChange={setNativeLang} />
          {sameLanguage && (
            <ThemedText type="small" themeColor="textSecondary">
              Pick two different languages.
            </ThemedText>
          )}

          <View style={styles.field}>
            <ThemedText type="smallBold">Words</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              One per line: word = translation. Tabs, &quot; - &quot;, &quot;:&quot; and &quot;;&quot; also work.
            </ThemedText>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              autoCapitalize="none"
              textAlignVertical="top"
              placeholder={'meeting = reunión\ndeadline = fecha límite\nto follow up = hacer seguimiento'}
              placeholderTextColor={theme.textSecondary}
              style={[inputStyle, styles.textArea]}
            />
          </View>

          {entries.length > 0 && (
            <ThemedView type="backgroundElement" style={styles.preview}>
              <ThemedText type="smallBold">
                {entries.length} word{entries.length === 1 ? '' : 's'} found
              </ThemedText>
              {entries.slice(0, PREVIEW_COUNT).map((entry) => (
                <ThemedText key={entry.term} type="small">
                  {entry.term} → {entry.translation || '…'}
                </ThemedText>
              ))}
              {entries.length > PREVIEW_COUNT && (
                <ThemedText type="small" themeColor="textSecondary">
                  and {entries.length - PREVIEW_COUNT} more
                </ThemedText>
              )}
              {untranslated > 0 && (
                <ThemedText type="small" themeColor="textSecondary">
                  {untranslated} without a translation. They are kept but left out of exercises until they have
                  one; AI translation is coming next.
                </ThemedText>
              )}
            </ThemedView>
          )}

          <BrandButton title="Save collection" onPress={save} disabled={!canSave} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    fontSize: 16,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
  },
  textArea: {
    minHeight: 180,
  },
  preview: {
    padding: Spacing.three,
    borderRadius: Radius.medium,
    gap: Spacing.one,
  },
});
