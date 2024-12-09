import {EquationTypeDto} from "../dto";
import {EquationValue} from "./equationValue";

export interface CompoundValue {
    name: string;
    chemicalFormula: string;
    Mr: number, // molar mass kg/mol
    enthalpyFormation: {
        defaultType: EquationTypeDto,
        values:[EquationValue],
    },
    // ΔG = M + NT (J/(mol*K))), Reference [1]
    gibbsEnergy:{
        g0: number,
        m: number,
        n: number,
        reagents: [],
        min: number,
        max: number,
        ref:number,
        page: number,
    },
    // Isobaric molar heat capacity J/(mol*K)
    heatCapacity: {
        defaultType: EquationTypeDto,
        values:EquationValue[]
    }
}