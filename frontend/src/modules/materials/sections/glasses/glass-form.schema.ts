import * as yup from 'yup';
import { GLASS_OXIDES } from '@/shared/ui/calc';
import { GLASSES_UI } from './constants/glasses-ui.constants';
import type { GlassTask } from './types/glass-task.type';

export const glassFormSchema = yup.object({
  composition: yup
    .mixed<Record<string, number>>()
    .required()
    .test('not-empty', 'Enter at least one oxide.', (value) => Object.values(value ?? {}).some((amount) => amount > 0))
    .test(
      'known-oxides',
      ({ value }) =>
        `Unknown components: ${Object.keys(value ?? {})
          .filter((key) => !(GLASS_OXIDES as readonly string[]).includes(key))
          .join(', ')}.`,
      (value) => Object.keys(value ?? {}).every((key) => (GLASS_OXIDES as readonly string[]).includes(key)),
    ),
  task: yup.mixed<GlassTask>().oneOf(['at-temperature', 'profile', 'temperature-at-viscosity']).required(),
  temperature_C: yup
    .number()
    .nullable()
    .when('task', { is: 'at-temperature', then: (schema) => schema.required('Enter a temperature.') }),
  targetLogEta: yup
    .number()
    .nullable()
    .when('task', {
      is: 'temperature-at-viscosity',
      then: (schema) =>
        schema
          .required('Enter the target log₁₀η.')
          .min(GLASSES_UI.targetLogEtaMin, `log₁₀η must be ≥ ${GLASSES_UI.targetLogEtaMin}.`)
          .max(GLASSES_UI.targetLogEtaMax, `log₁₀η must be ≤ ${GLASSES_UI.targetLogEtaMax}.`),
    }),
});
