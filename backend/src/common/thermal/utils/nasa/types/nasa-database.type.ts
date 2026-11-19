export type NasaDatabase<T> = {
  source: string;
  ref: string;
  count: number;
  species: Record<string, T>;
}
