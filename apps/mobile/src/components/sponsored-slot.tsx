import { openBrowserAsync } from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';

import { BrandButton } from '@/components/brand-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useSponsor } from '@/state/sponsor';

/**
 * Sponsored placement shown at the end of each session. It shows the direct
 * sponsor when there is one; otherwise it is where an ad-network banner
 * (AdMob) will go once the app runs as a development build.
 */
export function SponsoredSlot() {
  const { sponsor } = useSponsor();
  const cta = sponsor.cta;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
        Sponsored
      </ThemedText>
      <View style={styles.row}>
        <View style={[styles.monogram, { backgroundColor: sponsor.primary }]}>
          <ThemedText style={[styles.monogramText, { color: sponsor.onPrimary }]}>{sponsor.monogram}</ThemedText>
        </View>
        <View style={styles.text}>
          <ThemedText type="smallBold">{cta ? sponsor.name : 'Your brand here'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {cta ? sponsor.tagline : 'Sponsor LANBOX and appear in every learning session.'}
          </ThemedText>
        </View>
      </View>
      {cta && <BrandButton title={cta.label} onPress={() => openBrowserAsync(cta.url)} />}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  label: {
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  monogram: {
    width: 44,
    height: 44,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: {
    fontWeight: 800,
  },
  text: {
    flex: 1,
  },
});
