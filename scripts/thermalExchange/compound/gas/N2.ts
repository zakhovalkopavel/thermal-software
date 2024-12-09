import {CompoundValue} from "../../../interface";
import {EquationTypeDto} from "../../../dto";

export class N2 implements CompoundValue{
    name: "Nitrogen";
    chemicalFormula: "N2";
    Mr: 0.028;
    gibbsEnergy: {
        m: 0,
        n: 0,
        reagents: [],
        min: 0,
        max: 0,
    };
    heatCapacity: {
        defaultType: EquationTypeDto.linearHyperbolic,
        values:[
            {
                type: EquationTypeDto.quartic,
                ref:2,
                page:834,
                a: 29.342,
                b: -3.5395e-3,
                c: 1.0076e-5,
                d: -4.3116e-9,
                e: 2.5935e-13,
                min: 50,
                max: 1500,
            },
            {
                type: EquationTypeDto.cubic,
                ref:5,
                page:911,
                a: 28.883,
                b: -0.157,
                c: 0.808,
                d: -2.871,
                e: 0,
                min: 300,
                max: 1800,
            },
            {
                type: EquationTypeDto.linearHyperbolic,
                ref:1,
                page:268,
                a: 27.88,
                b: 4.27,
                c: 0,
                d: 0,
                e: 0,
                min: 298,
                max: 2500,
            }
        ]
    }
}