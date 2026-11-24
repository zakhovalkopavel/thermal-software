/** Composition wt% split by {@link ComponentProperty} category. */
export type ComponentsByCategory = {
  oxideFormers: Record<string, number>;
  oxideModifiers: Record<string, number>;
  fluorides: Record<string, number>;
  chlorides: Record<string, number>;
};
