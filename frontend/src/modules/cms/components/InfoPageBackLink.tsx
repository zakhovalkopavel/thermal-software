import { Button } from '@mui/material';
import { Link as RouterLink, useLocation, useSearchParams } from 'react-router-dom';
import { CalculatorPathFromInfoPath } from '../utils/calculator-path-from-info-path';

export function InfoPageBackLink() {
  const location = useLocation();
  const [params] = useSearchParams();
  const fromState =
    typeof (location.state as { from?: unknown } | null)?.from === 'string'
      ? ((location.state as { from: string }).from)
      : null;
  const fromQuery = params.get('back');
  const derived = CalculatorPathFromInfoPath.resolve(location.pathname);
  const backTo = fromQuery || fromState || derived;

  if (!backTo) {
    return null;
  }

  return (
    <Button component={RouterLink} to={backTo} size="small" variant="text" sx={{ alignSelf: 'flex-start' }}>
      Back to calculator
    </Button>
  );
}
