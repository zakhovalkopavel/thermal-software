import {EquationTypeDto} from "../dto";
import {EquationValue} from "./equationValue";

export interface CompoundValue {
    readonly name: string;
    readonly chemicalFormula: string;
    readonly Mr: number, // molar mass kg/mol
    readonly enthalpyFormation298: number,
    readonly enthalpyFormation: {
        def: EquationTypeDto,
        values:[EquationValue],
    },
    readonly gibbsEnergy298: number,
    // ΔG = M + NT (J/(mol*K)) [ => a+bT]
    readonly gibbsEnergy:{
        reagents: string[],
        values: EquationValue
    },
    // Isobaric molar heat capacity J/(mol*K)
    readonly heatCapacity: {
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
}