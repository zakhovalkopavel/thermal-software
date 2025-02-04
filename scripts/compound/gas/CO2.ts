import {CompoundValue} from "../../interface";
import {EquationTypeDto} from "../../dto";

export class CO2 implements CompoundValue{
    name: "Carbon dioxide";
    chemicalFormula: "CO2";
    Mr: 0.04401;
    enthalpyFormation298: -393.51e3;
    gibbsEnergy298:-394.38e3;
    collisionDiameter: 3.941;
    epsilonToKb: 195.2;
    gibbsEnergy: {
        reagents: ["C","O2"],
        value: {
            type: EquationTypeDto.quadratic,
            ref:6,
            page:320,
            k: 1000,
            vars: {
                a: -393.36,
                b: -3.8212e-3,
                c: 1.3322e-6,
            },
            min: 298,
            max: 1000,
        }
    };
    heatCapacity: {
        def: 1,
        values: [
            {
                type: EquationTypeDto.quartic,
                ref: 6,
                page: 51,
                vars: {
                    a:27.437,
                    b:4.2315e-2,
                    c:-1.9555e-5,
                    d:3.9968e-9,
                    e:-2.9872e-13,
                },
                min: 50,
                max: 5000,
            },
            {
                type: EquationTypeDto.cubic,
                ref: 5,
                page: 911,
                vars: {
                    a: 22.26,
                    b: 5.981e-2,
                    c: -3.501e-5,
                    d: 7.469e-9,
                },
                min: 273,
                max: 1800,
            },
            {
                type: EquationTypeDto.linearHyperbolic,
                ref: 1,
                page: 268,
                vars: {
                    a: 44.17,
                    b: 9.04e-3,
                    d: -8.54e5,
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
                    c1: 0.2937e5,
                    c2: 0.3454e5,
                    c3: 1.428e3,
                    c4: 0.264e5,
                    c5: 588,
                },
                min: 50,
                max: 5000,
            },
            {
                type: EquationTypeDto.linearHyperbolic,
                ref:4,
                page:203,
                vars: {
                    a: 10.34,
                    b: 0.00274,
                    d: -195500,
                },
                min: 273,
                max: 1200,
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
                    a: 11.811,
                    b: 4.9838e-1,
                    c: -1.0851e-4,
                },
                min: 195,
                max: 1500,
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
                    a: -0.012,
                    b: 1.0208e-4,
                    c: -2.2403e-8,
                },
                min: 195,
                max: 1500,
            },
            {
                type: EquationTypeDto.dipprN102,
                ref: 15,
                page: 324,
                vars: {
                    c1: 3.69,
                    c2: -0.3838,
                    c3: 964,
                    c4: 1860000,
                },
                min: 194.67,
                max: 1500,
            },
        ]
    };
}