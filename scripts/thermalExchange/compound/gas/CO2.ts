import {CompoundValue} from "../../../interface";
import {EquationTypeDto} from "../../../dto";

export class CO2 implements CompoundValue{
    name: "Carbon dioxide";
    chemicalFormula: "CO2";
    Mr: 0.044;
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
            page:911,            a: 22.243,
            b: 5.977,
            c: -3.499,
            d: 7.464,
            min: 300,
            max: 1800,
        },
        {
            type: EquationTypeDto.linearHyperbolic,
            ref:1,
            page:268,
            a: 44.17,
            b: 9.04,
            d: -8.54,
            min: 298,
            max: 2500,
        }
    }
}