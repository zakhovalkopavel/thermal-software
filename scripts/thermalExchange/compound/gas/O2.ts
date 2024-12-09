import {CompoundValue} from "../../../interface";
import {EquationTypeDto} from "../../../dto";

export class O2 implements CompoundValue{
    name: "Oxygen";
    chemicalFormula: "O2";
    Mr: 0.032;
    gibbsEnergy: {
        m: 0,
        n: 0,
        reagents: [],
        min: 0,
        max: 0,
    };
    heatCapacity: {
        defaultType: EquationTypeDto.cubic,
        values:[
            {
                type: "quartic",
                ref:2,
                page:834,
            a: 29.526,
            b: -8.8999e-3,
            c: 3.8083e-5,
            d: -3.2629e-8,
            e: 8.8607e-12,
            min: 50,
            max: 1500,
        },
        {
            type: EquationTypeDto.cubic,
            ref:5,
            page:911,            a: 25.460,
            b: 1.519,
            c: -0.715,
            d: 1.311,
            min: 300,
            max: 1800,
        },
        {
            type: EquationTypeDto.linearHyperbolic,
            ref:1,
            page:268,
            a: 29.98,
            b: 4.2,
            d: -1.7,
            min: 298,
            max: 3000,
        }

    }
}