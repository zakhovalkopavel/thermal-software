/** Temperature law of the solid conductivity of a fired raw material */
export enum ConductionLaw {
  /** λ(T) = λ_am + (λ_ref − λ_am) · T_ref / T */
  PHONON = 'phonon',
  /** λ(T) = λ_ref (metallic carbides and nitrides) */
  ELECTRONIC = 'electronic',
}
