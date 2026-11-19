/** One entry from CoolProp `mixture_departure_functions.json`. */
export type CoolpropDepartureFunction = {
  Name: string;
  type: string;
  BibTeX?: string;
  aliases?: readonly string[];
  Npower?: number;
  n: readonly number[];
  t: readonly number[];
  d: readonly number[];
  l?: readonly number[];
  eta?: readonly number[];
  epsilon?: readonly number[];
  beta?: readonly number[];
  gamma?: readonly number[];
};
