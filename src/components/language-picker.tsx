import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LANGUAGES } from '@/lib/languages';
import { useSponsor } from '@/state/sponsor';

type Props = {
  label: string;
  value: string;
  onChange: (code: string) => void;
};

export function LanguagePicker({ label, value, onChange }: Props) {
  const theme = useTheme();
  const { sponsor } = useSponsor();

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {LANGUAGES.map((language) => {
          const selected = language.code === value;
          return (
            <Pressable
              key={language.code}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(language.code)}
              style={[styles.chip, { backgroundColor: selected ? sponsor.primary : theme.backgroundElement }]}>
              <ThemedText type="small" style={selected && { color: sponsor.onPrimary }}>
                {language.name}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  chips: {
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.large,
  },
});
