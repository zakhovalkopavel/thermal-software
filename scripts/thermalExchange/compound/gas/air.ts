import {CompoundValue} from "../../../interface";
import {EquationTypeDto} from "../../../dto";

export class Air implements CompoundValue{
    name: "Air";
    chemicalFormula: "78.084%(v) N2, 20.946%(v) O2, 0.934%(v) Ar, 0.0412%(v) CO2";
    Mr: 0.028951;
    enthalpyFormation298: 0;
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
            {//?????
                type: EquationTypeDto.quartic,
                ref:6,//2
                page:36,//834
                vars: {

                },
                min: 50,
                max: 1500,
            },
            {
                type: EquationTypeDto.cubic,
                ref:5,
                page:911,
                vars: {
                    a:28.11,
                    b:0.1967e-2,
                    c:0.4802e-5,
                    d:-1.966e-9,
                },
                min: 273,
                max: 1800,
            },
            {
                type: EquationTypeDto.alyLee,
                ref:4,
                page: 223,
                k: 1e-3,
                vars: {
                    c1: 0.2896e5,
                    c2: 0.0939e5,
                    c3: 3.012e3,
                    c4: 0.0758e5,
                    c5: 1484,
                },
                min: 50,
                max: 1500,
            },
            {
                type: EquationTypeDto.linear,
                ref:4,
                page:203,
                vars: {

                },
                min: 273,
                max: 1200,
            },
        ]
    }
}