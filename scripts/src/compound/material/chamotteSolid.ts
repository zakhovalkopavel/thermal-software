import {CompoundValue, EquationValue} from "../../interface";
import {ChemicalComposition} from "../../interface/chemicalComposition";

export class ChamotteSolid implements CompoundValue{
    name: "ChamotteSolid";

    readonly chemicalComposition: [
        {
            compound:'',
            w:,
            m:,
        }
    ];

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