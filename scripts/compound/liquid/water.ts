import {CompoundValue} from "../../interface";

export class Water implements CompoundValue{
    name: "Water";
    chemicalFormula: "H2O";
    Mr: 0.018;
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