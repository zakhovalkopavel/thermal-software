import {CompoundValue} from "../../../interface";
import {EquationTypeDto} from "../../../dto";

export class CH4 implements CompoundValue{
    name: "Methane";
    chemicalFormula: "CH4";
    Mr: 0.016;
    enthalpyFormation298: -74.85e3;
    enthalpyFormation:{
        def: 0,
        values: [
            {
                type:

            }
        ]
    }
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
                ref:6,//2
                page:36,//834
                vars: {
                    a: 34.942,
                    b: -3.9957e-2,
                    c: 1.9184e-4,
                    d: -1.5303e-7,
                    e: 3.9321e-11,
                },
                min: 50,
                max: 1500,
            },
            {
                type: EquationTypeDto.cubic,
                ref:5,
                page:911,
                vars: {
                    a: 19.875,
                    b: 5.021,
                    c: 1.268,
                    d: -11.004,
                },
                min: 300,
                max: 1800,
            },
            {
                type: EquationTypeDto.alyLee,
                ref:4,
                page:219,
                k:1e-3,
                vars:{
                    c1:33300,
                    c2:79930,
                    c3:2086.9,
                    c4:41600,
                    c5:991.96,
                }
                min: 50,
                max: 1500,
            },
        ]
    }
}