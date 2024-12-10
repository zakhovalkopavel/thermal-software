import {CompoundValue} from "../../../interface";
import {EquationTypeDto} from "../../../dto";

export class H2O implements CompoundValue{
    name: "Water gas";
    chemicalFormula: "H2O";
    Mr: 0.018;
    gibbsEnergy: {
        m: 0,
        n: 0,
        reagents: [],
        min: 0,
        max: 0,
    };
    heatCapacity: {
        defaultType: EquationTypeDto.cubic,
        values: [
            {
                type: EquationTypeDto.quartic,
                ref: 2,
                page: 834,
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
                    a: 32.218,
                    b: 0.192,
                    c: 1.055,
                    d: -3.593,
                },
                min: 300,
                max: 1800,
            },
            {
                type: EquationTypeDto.linearHyperbolic,
                ref: 1,
                page: 268,
                a: 30.02,
                b: 10.72,
                d: 0.33,
                min: 298,
                max: 2500,
            },
            {
                type: EquationTypeDto.alyLee,
                ref: 4,
                page: 223,
                k: 1e-3,
                vars: {
                    c1: 33360,
                    c2: 26790,
                    c3: 2610.5,
                    c4: 8900,
                    c5: 1169,
                },
                min: 100,
                max: 2273.15,
            },
        ],
    }
};