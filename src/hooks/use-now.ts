import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

/** Current time, refreshed whenever the screen regains focus (e.g. back from a session). */
export function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useFocusEffect(useCallback(() => setNow(Date.now()), []));
  return now;
}
