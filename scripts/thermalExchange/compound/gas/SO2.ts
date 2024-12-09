import {CompoundValue} from "../../../interface";
import {EquationTypeDto} from "../../../dto";

export class SO2 implements CompoundValue{
    name: "Sulfur dioxide";
    chemicalFormula: "SO2";
    Mr: 0.064;
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
            a: 29.637,
            b: 3.4735e-2,
            c: 9.2903e-6,
            d: -2.9885e-8,
            e: 1.0937e-11,
            min: 100,
            max: 1500,
        },

    }
}