import {CompoundValue} from "../../../interface";
import {EquationTypeDto} from "../../../dto";

export class O2 implements CompoundValue{
    name: "Oxygen";
    chemicalFormula: "O2";
    Mr: 0.031999;
    enthalpyFormation298: 0;
    gibbsEnergy298:0;
    collisionDiameter: 3.467;
    epsilonToKb: 106.7;
    heatCapacity: {
        def: 1,
        values: [
            {
                type: EquationTypeDto.quartic,
                ref: 6,
                page: 53,
                vars: {
                    a: 29.526,
                    b: -8.8999e-3,
                    c: 3.8083e-5,
                    d: -3.2629e-8,
                    e: 8.8607e-12,
                }
                min: 50,
                max: 1500,
            },
            {
                type: EquationTypeDto.cubic,
                ref: 5,
                page: 911,
                vars: {
                    a: 25.48,
                    b: 1.52e-2,
                    c: -0.7155e-5,
                    d: 1.312e-9,
                }
                min: 273,
                max: 1800,
            },
            {
                type: EquationTypeDto.linearHyperbolic,
                ref: 1,
                page: 268,
                vars: {
                    a: 29.98,
                    b: 4.2e-3,
                    d: -1.7e5,
                }
                min: 298,
                max: 3000,
            },
            {
                type: EquationTypeDto.linearHyperbolic,
                ref: 4,
                page: 206,
                vars: {
                    a: 8.27,
                    b: 0.000258,
                    d: -187700,
                }
                min: 300,
                max: 5000,
            },
            {
                type: EquationTypeDto.alyLee,
                ref: 4,
                page: 223,
                k: 1e-3,
                vars: {
                    c1: 0.291e5,
                    c2: 0.1004e5,
                    c3: 2.5265e3,
                    c4: 0.0936e5,
                    c5: 1153.8,
                },
                min: 50,
                max: 1500,
            },
        ]
    }
    viscosity: {
        def: 0,
        values:[
            {
                type: EquationTypeDto.quadratic,
                ref:6,
                page:475,
                k: 1e6,
                vars: {
                    a: 44.224,
                    b: 5.62e-1,
                    c: -1.13e-4,
                },
                min: 150,
                max: 1500,
            },
        ]
    };
}