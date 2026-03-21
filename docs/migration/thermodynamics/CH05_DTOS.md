# CH05 — DTOs

## `GasMixtureInputDto`

```typescript
export class GasMixtureInputDto {
  @IsObject()
  composition: Partial<Record<Species, number>>;   // mole or mass fractions, must sum to 1

  @IsNumber() @Min(100) @Max(6000)
  T_K: number;

  @IsOptional() @IsNumber() @Min(0.1) @Max(300)
  P_atm?: number;    // default 1.0

  @IsOptional() @IsEnum(FractionType)
  fractionType?: 'mole' | 'mass';    // default 'mole'
}
```

## `GasPropertiesResultDto`

```typescript
export class GasPropertiesResultDto {
  Cp_J_kgK: number;           // mixture Cp
  H_J_mol: number;            // mixture molar enthalpy (NASA-7)
  mu_Pa_s: number;            // mixture dynamic viscosity
  lambda_W_mK: number;        // mixture thermal conductivity
  rho_kg_m3: number;          // mixture density
  Pr: number;                 // Prandtl number
  molecularWeight_kg_mol: number;
  diffusion?: Partial<Record<Species, number>>;   // optional, expensive
}
```

## `Species` enum

```typescript
export enum Species {
  N2  = 'N2',
  O2  = 'O2',
  CO2 = 'CO2',
  CO  = 'CO',
  H2O = 'H2O',
  H2  = 'H2',
  CH4 = 'CH4',
  NH3 = 'NH3',
}
```

> `NH3` is added here even though `furnaceCombustion` classes don't include it — the shared library does.  
> Transport and diffusion parameters for NH3 must be added (see CH03).

