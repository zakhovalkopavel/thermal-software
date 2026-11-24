# CoolProp Helmholtz EOS sources

Vendored from [CoolProp](https://github.com/CoolProp/CoolProp) for Helmholtz-energy
equations of state used by density calculations.

| Path | Upstream |
|------|----------|
| `fluids/*.json` | `dev/fluids/*.json` |
| `mixture_binary_pairs.json` | `dev/mixtures/mixture_binary_pairs.json` |
| `mixture_departure_functions.json` | `dev/mixtures/mixture_departure_functions.json` |

- **Upstream commit:** `075f4ec030df6e3f6549522da947fe01e7bc04ca` (2026-11-16)
- **License:** CoolProp MIT — see https://github.com/CoolProp/CoolProp/blob/master/LICENSE
- Pure-fluid EOS coefficients live only under `fluids/`. Binary interaction /
  departure parameters are **not** pure EOS coefficients.

Do not hand-edit the JSON; re-copy from CoolProp when updating.
