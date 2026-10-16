import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { HOUSE_SPONSOR } from '@/constants/sponsors';
import { Spacing } from '@/constants/theme';
import { useSponsor } from '@/state/sponsor';

/** The sponsor's brand block at the top of the home screen. */
export function SponsorHero() {
  const { sponsor } = useSponsor();
  const insets = useSafeAreaInsets();
  const sponsored = sponsor.id !== HOUSE_SPONSOR.id;

  return (
    <View style={[styles.hero, { backgroundColor: sponsor.primary, paddingTop: insets.top + Spacing.four }]}>
      <View style={[styles.monogram, { backgroundColor: sponsor.onPrimary }]}>
        <ThemedText style={[styles.monogramText, { color: sponsor.primary }]}>{sponsor.monogram}</ThemedText>
      </View>
      <View style={styles.text}>
        {sponsored && (
          <ThemedText type="small" style={[styles.presented, { color: sponsor.onPrimary }]}>
            LANBOX · presented by
          </ThemedText>
        )}
        <ThemedText style={[styles.name, { color: sponsor.onPrimary }]}>{sponsor.name}</ThemedText>
        <ThemedText type="small" style={{ color: sponsor.onPrimary }}>
          {sponsor.tagline}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  monogram: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: {
    fontSize: 20,
    fontWeight: 800,
  },
  text: {
    flex: 1,
  },
  presented: {
    opacity: 0.8,
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 1,
  },
  name: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: 800,
  },
});
