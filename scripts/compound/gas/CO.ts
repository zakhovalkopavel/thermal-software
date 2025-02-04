import {CompoundValue} from "../../interface";
import {EquationTypeDto} from "../../dto";

export class CO implements CompoundValue {
    name: "Carbon monoxide";
    chemicalFormula: "CO";
    Mr: 0.02801;
    enthalpyFormation298:-110.54e3;
    gibbsEnergy298:-137.28e3;
    collisionDiameter: 3.69;
    epsilonToKb: 91.7;
    gibbsEnergy: {
        reagents: ["C","O2"],
        value: {
            type: EquationTypeDto.quadratic,
            ref:6,
            page:320,
            k: 1000,
            vars: {
                a: -109.885,
                b: -9.2218e-2,
                c: 1.4547e-6,
            },
            min: 298,
            max: 1000,
        }
    };
    heatCapacity: {
        def: 3,
        values: [
            {
                type: EquationTypeDto.quartic,
                ref: 6,
                page: 51,
                vars: {
                    a: 29.556,
                    b: -6.5807e-3,
                    c: 2.013e-5,
                    d: -1.2227e-8,
                    e: 2.2617e-12,
                },
                min: 60,
                max: 1500,
            },
            {
                type: EquationTypeDto.cubic,
                ref: 5,
                page: 911,
                vars: {
                    a: 28.16,
                    b: 0.1675e-2,
                    c: 0.5372e-5,
                    d: -2.222e-9,
                },
                min: 273,
                max: 1800,
            },
            {
                type: EquationTypeDto.linearHyperbolic,
                ref: 1,
                page: 271,
                vars: {
                    a: 28.43,
                    b: 4.1e-3,
                    d: -0.46e5,
                },
                min: 298,
                max: 2500,
            },
            {
                type: EquationTypeDto.alyLee,
                ref: 4,
                page: 223,
                k: 1e-3,
                vars: {
                    c1: 0.2911e5,
                    c2: 0.0877e5,
                    c3: 3.0851e3,
                    c4: 0.0846e5,
                    c5: 1538.2,
                },
                min: 60,
                max: 1500,
            },
            {
                type: EquationTypeDto.linear,
                ref: 4,
                page: 203,
                vars: {
                    a: 6.6,
                    b: 0.0012,
                },
                min: 273,
                max: 2500,
            },
        ]
    };
    viscosity: {
        def: 0,
        values:[
            {
                type: EquationTypeDto.quadratic,
                ref:6,
                page:455,
                k: 1e6,
                vars: {
                    a: 23.811,
                    b: 5.3944e-1,
                    c: -1.5411e-4,
                },
                min: 68,
                max: 1250,
            },
        ]
    };
    thermalConductivity: {
        def: 0,
        values: [
            {
                type: EquationTypeDto.quadratic,
                ref: 2,
                page: 838,
                vars: {
                    a: 0.00158,
                    b: 8.2511e-5,
                    c: -1.9081e-8,
                },
                min: 70,
                max: 1250,
            },
            {
                type: EquationTypeDto.dipprN102,
                ref: 15,
                page: 325,
                vars: {
                    c1: 0.00059882,
                    c2: 0.6863,
                    c3: 57.13,
                    c4: 501.92,
                },
                min: 70,
                max: 1500,
            },
        ]
    };
}