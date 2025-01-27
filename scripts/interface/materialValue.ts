import {EquationValue} from "./equationValue";
import {ChemicalComposition} from "./chemicalComposition";

export interface MaterialValue {
    readonly name: string;
    readonly chemicalComposition: [ChemicalComposition];

    readonly heatCapacity: {
        def: number,
        values:EquationValue[]
    }
    readonly emissivity:{
        def: number,
        values:EquationValue[]
    }
    readonly viscosity:{
        def: number,
        values:EquationValue[]
    },
    readonly density:{
        def: number,
        values:EquationValue[]
    }
    readonly thermalExpansion:{
        def: number,
        values:EquationValue[]
    }
    readonly meltingPoint: number;
    readonly boilingPoint: number;
}