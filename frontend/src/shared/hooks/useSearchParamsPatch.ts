import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Sets several query parameters in one navigation; `null` removes a parameter. */
export function useSearchParamsPatch(): [URLSearchParams, (patch: Record<string, string | null>) => void] {
  const [params, setParams] = useSearchParams();
  const patch = useCallback(
    (values: Record<string, string | null>) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [name, value] of Object.entries(values)) {
            if (value) next.set(name, value);
            else next.delete(name);
          }
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  return [params, patch];
}
