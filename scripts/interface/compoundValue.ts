import {EquationValue} from "./equationValue";

export interface CompoundValue {
    readonly name: string;
    readonly chemicalFormula: string;
    readonly Mr: number, // molar mass kg/mol
    readonly enthalpyFormation298: number; // J/mol
    readonly gibbsEnergy298: number; // J/mol

    //collision diameter (σ) Å, ref 7
    readonly collisionDiameter: number;

    // ε/kB, Lennard-Jones potential model coefficient
    // to determine characteristic temperature T* = T/(ε/kB)
    // ε - is the depth of the potential and
    // kB - Boltzmann's constant
    // ref 7
    readonly epsilonToKb: number;

    // ΔG = M + NT (J/(mol*K)) [ => a+bT]
    readonly gibbsEnergy?:{
        reagents: string[],
        value: EquationValue
    };
    // Isobaric molar heat capacity J/(mol*K)
    readonly heatCapacity: {
        def: number,
        values: EquationValue[]
    };
    readonly viscosity: {
        def: number,
        values: EquationValue[]
    };
    readonly thermalConductivity: {
        def: number,
        values: EquationValue[]
    };
}