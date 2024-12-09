import {CompoundValue} from "../../../interface";
import {EquationTypeDto} from "../../../dto";

export class SO3 implements CompoundValue{
    name: "Sulfur trioxide";
    chemicalFormula: "SO3";
    Mr: 0.08;
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