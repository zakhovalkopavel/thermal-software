import {CompoundValue} from "../../../interface";
import {EquationTypeDto} from "../../../dto";

export class CO implements CompoundValue{
    name: "Carbon monoxide";
    chemicalFormula: "CO";
    Mr: 0.028;
    gibbsEnergy: {
        m: 0,
        n: 0,
        reagents: [],
        min: 0,
        max: 0,
    };
    heatCapacity: {
        defaultType: 0,
        values:[
            {
                type: EquationTypeDto.quartic,
                ref:6,
                page:36,
                vars: {
                    a: 29.556,
                    b: -6.5807e-3,
                    c: 2.0130e-5,
                    d: -1.2227e-8,
                    e: 2.2617e-12,
                },
            min: 60,
            max: 1500,
        },
        {
            type: EquationTypeDto.cubic,
            ref:5,
            page:911,
            vars: {
                a: 28.142,
                b: 0.167,
                c: 0.537,
                d: -2.221,
            },
            min: 300,
            max: 1800,
        },
        {
            type: EquationTypeDto.linearHyperbolic,
            ref:1,
            page:268,
            vars: {
                a: 28.43,
                b: 4.1,
                d: -0.46,
            },
            min: 298,
            max: 2500,
        },
        {
            type: EquationTypeDto.alyLee,
            ref:4,
            page:223,
            k:1e-3,
            vars:{
                c1:29110,
                c2:8770,
                c3:3085.1,
                c4:8460,
                c5:1538.2,
            }
            min: 60,
            max: 1500,
        }
    ]
}