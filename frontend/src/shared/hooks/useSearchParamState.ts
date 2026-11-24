import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useSearchParamState(name: string): [string | null, (value: string | null) => void] {
  const [params, setParams] = useSearchParams();
  const setValue = useCallback(
    (value: string | null) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (value) next.set(name, value);
          else next.delete(name);
          return next;
        },
        { replace: true },
      ),
    [name, setParams],
  );
  return [params.get(name), setValue];
}
