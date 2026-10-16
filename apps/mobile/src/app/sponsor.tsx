import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { SponsoredSlot } from '@/components/sponsored-slot';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SPONSORS } from '@/constants/sponsors';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useSponsor } from '@/state/sponsor';

/** Demo screen: switch the brand the whole app wears, e.g. to show a prospective sponsor. */
export default function SponsorPreviewScreen() {
  const { sponsor: current, selectSponsor } = useSponsor();

  return (
    <ThemedView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="small" themeColor="textSecondary">
          Preview the app under each sponsor&apos;s brand. In production the sponsor comes from the active
          campaign.
        </ThemedText>

        {SPONSORS.map((sponsor) => {
          const selected = sponsor.id === current.id;
          return (
            <Pressable
              key={sponsor.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => selectSponsor(sponsor.id)}>
              <ThemedView
                type="backgroundElement"
                style={[styles.option, { borderColor: selected ? sponsor.primary : 'transparent' }]}>
                <View style={[styles.swatch, { backgroundColor: sponsor.primary }]}>
                  <ThemedText type="smallBold" style={{ color: sponsor.onPrimary }}>
                    {sponsor.monogram}
                  </ThemedText>
                </View>
                <View style={styles.text}>
                  <ThemedText type="smallBold">{sponsor.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {sponsor.tagline}
                  </ThemedText>
                </View>
                {selected && <ThemedText style={{ color: sponsor.primary }}>✓</ThemedText>}
              </ThemedView>
            </Pressable>
          );
        })}

        <ThemedText type="smallBold" style={styles.previewLabel}>
          End-of-session placement
        </ThemedText>
        <SponsoredSlot />
      </ScrollView>
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
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 2,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  previewLabel: {
    marginTop: Spacing.three,
  },
});
