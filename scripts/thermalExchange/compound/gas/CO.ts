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
        defaultType: EquationTypeDto.linearHyperbolic,
        values:[
            {
                type: EquationTypeDto.quartic,
                ref:2,
                page:834,
            a: ,
            b: ,
            c: ,
            d: ,
            e: ,
            min: 250,
            max: 1500,
        },
        {
            type: EquationTypeDto.cubic,
            ref:5,
            page:911,            a: 28.142,
            b: 0.167,
            c: 0.537,
            d: -2.221,
            min: 300,
            max: 1800,
        },
        {
            type: EquationTypeDto.linearHyperbolic,
            ref:1,
            page:268,
            a: 28.43,
            b: 4.1,
            d: -0.46,
            min: 298,
            max: 2500,
        }
    }
}