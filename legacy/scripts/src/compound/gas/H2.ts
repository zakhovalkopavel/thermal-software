import {CompoundValue} from "../../interface";
import {EquationTypeDto} from "../../dto";

export class H2 implements CompoundValue{
    name: "Hydrogen";
    chemicalFormula: "H2";
    Mr: 0.002016;
    enthalpyFormation298: 0;
    gibbsEnergy298:0;
    collisionDiameter: 2.827;
    epsilonToKb: 59.7;
    heatCapacity: {
        def: 1,
        values:[
            {
                type: EquationTypeDto.quartic,
                ref:6,
                page:52,
                vars: {
                    a: 25.399,
                    b: 2.0178e-2,
                    c: -3.8549e-5,
                    d: 3.188e-8,
                    e: -8.7585e-12,
                },
                min: 250,
                max: 1500,
            },
            {
                type: EquationTypeDto.cubic,
                ref:5,
                page:911,
                vars: {
                    a: 29.11,
                    b: -0.1916e-2,
                    c: 0.4003e-5,
                    d: -0.8704e-9,
                },
                min: 273,
                max: 1800,
            },
            {
                type: EquationTypeDto.linear,
                ref: 4,
                page: 203,
                vars: {
                    a: 6.62,
                    b: 0.00081,
                },
                min: 273,
                max: 2500,
            },
            {
                type: EquationTypeDto.linearHyperbolic,
                ref: 1,
                page: 268,
                vars: {
                    a: 27.3,
                    b: 3.27e-3,
                    d: 0.5e5,
                },
                min: 298,
                max: 3000,
            },
            {
                type: EquationTypeDto.alyLee,
                ref: 4,
                page: 222,
                k: 1e-3,
                vars: {
                    c1: 0.2762e5,
                    c2: 0.0956e5,
                    c3: 2.4663e3,
                    c4: 0.0376e5,
                    c5: 567.6,
                },
                min: 250,
                max: 1500,
            }
        ]
    };
    viscosity: {
        def: 0,
        values:[
            {
                type: EquationTypeDto.quadratic,
                ref:6,
                page:474,
                k: 1e6,
                vars: {
                    a: 27.758,
                    b: 2.12e-1,
                    c: -3.28e-5,
                },
                min: 150,
                max: 1500,
            },
        ]
    };
    thermalConductivity: {
        def: 0,
        values: [
            {
                type: EquationTypeDto.quadratic,
                ref: 2,
                page: 838,
                vars: {
                    a: 0.03951,
                    b: 4.5918e-04,
                    c: -6.4933e-08,

                },
                min: 150,
                max: 1500,
            },
            {
                type: EquationTypeDto.dipprN102,
                ref: 15,
                page: 328,
                vars: {
                    c1: 0.002653,
                    c2: 0.7452,
                    c3: 12,
                    c4: 0,
                },
                min: 22,
                max: 1600,
            },
        ]
    };
}