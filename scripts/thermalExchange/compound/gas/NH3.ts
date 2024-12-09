import {CompoundValue} from "../../../interface";
import {EquationTypeDto} from "../../../dto";

export class NH3 implements CompoundValue{
    name: "Ammonia";
    chemicalFormula: "NH3";
    Mr: 0.17;
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
            a: 33.573,
            b: -1.2581e-2,
            c: 8.8906e-5,
            d: -7.1783e-8,
            e: 1.8569e-11,
            min: 100,
            max: 1500,
        },
        {
            type: EquationTypeDto.cubic,
            ref:5,
            page:911,            a: 24.619,
            b: 3.75,
            c: -0.138,
            d: 0,
            min: ,
            max:,
        },
        {
            type: EquationTypeDto.linearHyperbolic,
            ref:1,
            page:268,
            a: ,
            b: ,
            d: ,
            min: ,
            max: ,
        }
    }
}