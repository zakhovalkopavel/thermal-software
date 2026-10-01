import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay_ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay_ms);
    return () => clearTimeout(timer);
  }, [value, delay_ms]);
  return debounced;
}
