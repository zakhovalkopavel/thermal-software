import {CompoundValue} from "../../../interface";
import {EquationTypeDto} from "../../../dto";

export class NO2 implements CompoundValue{
    name: "Nitrogen dioxide";
    chemicalFormula: "NO2";
    Mr: 0.046;
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

    }
}