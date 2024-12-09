import {CompoundValue} from "../../../interface";
import {EquationTypeDto} from "../../../dto";

export class H2 implements CompoundValue{
    name: "Hydrogen";
    chemicalFormula: "H2";
    Mr: 0.002;
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
                a: 25.399,
                b: 2.0178e-2,
                c: -3.8549e-5,
                d: 3.188e-8,
                e: -8.7585e-12,
                min: 250,
                max: 1500,
            },
            {
                type: EquationTypeDto.cubic,
                ref:5,
                page:911,
                a: 29.088,
                b: -0.192,
                c: 0.400,
                d: -0.870,
                e: 0,
                min: 273,
                max: 1800,
            },
            {
                type: EquationTypeDto.linearHyperbolic,
                ref:1,
                page:268,
                a: 27.3,
                b: 3.27,
                c: 0,
                d: 0.5,
                e: 0,
                min: 298,
                max: 3000,
            }
        ]
    }
}