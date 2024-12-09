import {CompoundValue} from "../../../interface";

export class C implements CompoundValue{
    name: "Carbon";
    chemicalFormula: "C";
    Mr: 0.012;
    gibbsEnergy: {
        m: 0,
        n: 0,
        reagents: [],
        min: 0,
        max: 0,
    };
    heatCapacity: {
        default: "linearHyperbolic",
        quartic: {
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