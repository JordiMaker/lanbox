import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { isLightColor } from '@/constants/theme';
import { LibraryProvider, useLibrary } from '@/state/library';
import { SponsorProvider, useSponsor } from '@/state/sponsor';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SponsorProvider>
      <LibraryProvider>
        <AppStack />
      </LibraryProvider>
    </SponsorProvider>
  );
}

function AppStack() {
  const colorScheme = useColorScheme();
  const { sponsor, ready: sponsorReady } = useSponsor();
  const { ready: libraryReady } = useLibrary();

  useEffect(() => {
    if (sponsorReady && libraryReady) SplashScreen.hideAsync();
  }, [sponsorReady, libraryReady]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Every screen's header carries the sponsor's colour. */}
      <StatusBar style={isLightColor(sponsor.primary) ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: sponsor.primary },
          headerTintColor: sponsor.onPrimary,
          headerTitleStyle: { fontWeight: '700' },
          headerBackButtonDisplayMode: 'minimal',
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="collection/new" options={{ title: 'New collection', presentation: 'modal' }} />
        <Stack.Screen name="collection/[id]" options={{ title: '' }} />
        <Stack.Screen name="practice" options={{ title: 'Practice' }} />
        <Stack.Screen name="sponsor" options={{ title: 'Sponsor preview' }} />
      </Stack>
    </ThemeProvider>
  );
}
