import {ChemicalCompoundsDto} from "../dto/chemicalCompounds.dto";

export interface ChemicalComposition  {
    readonly compound: ChemicalCompoundsDto;
    readonly w: number; //weight fraction
    readonly m?: number; //mole fraction
}