import {CompoundValue} from "../../../interface";
import {EquationTypeDto} from "../../../dto";

export class H2 implements CompoundValue{
    name: "Hydrogen";
    chemicalFormula: "H2";
    Mr: 0.002016;
    enthalpyFormation298: 0;
    gibbsEnergy298:0;
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
                }
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
                }
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
                }
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
                }
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
    }
}