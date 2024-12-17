import {CompoundValue} from "../../../interface";
import {EquationTypeDto} from "../../../dto";

export class H2O implements CompoundValue{
    name: "Water gas";
    chemicalFormula: "H2O";
    Mr: 0.018015;
    enthalpyFormation298: -241.8e3;
    gibbsEnergy298:-228.6e3;
    collisionDiameter: 2.641;
    epsilonToKb: 809.1;
    heatCapacity: {
        def: 1,
        values: [
            {
                type: EquationTypeDto.quartic,
                ref: 6,
                page: 52,
                vars: {
                    a: 33.933,
                    b: -8.4186e-3,
                    c: 2.9906e-5,
                    d: -1.7825e-8,
                    e: 3.6934e-12,
                },
                min: 100,
                max: 1500,
            },
            {
                type: EquationTypeDto.cubic,
                ref: 5,
                page: 911,
                vars: {
                    a: 32.24,
                    b: 0.1923e-2,
                    c: 1.055e-5,
                    d: -3.595e-9,
                },
                min: 273,
                max: 1800,
            },
            {
                type: EquationTypeDto.linearHyperbolic,
                ref: 1,
                page: 273,
                vars: {
                    a: 30.02,
                    b: 10.72e-3,
                    d: 0.33e5,
                },
                min: 298,
                max: 2500,
            },
            {
                type: EquationTypeDto.alyLee,
                ref: 4,
                page: 223,
                k: 1e-3,
                vars: {
                    c1: 0.3336e5,
                    c2: 0.2679e5,
                    c3: 2.6105e3,
                    c4: 0.089e5,
                    c5: 1169,
                },
                min: 100,
                max: 2273.15,
            },
            {
                type: EquationTypeDto.quadratic,
                ref: 4,
                page: 203,
                vars: {
                    a: 8.22,
                    b: 0.00015,
                    c: 0.00000134,
                },
                min: 300,
                max: 2500,
            },
        ],
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
                    a: -36.826,
                    b: 4.29e-1,
                    c: -1.62e-5,
                },
                min: 280,
                max: 1073,
            },
        ]
    };
};