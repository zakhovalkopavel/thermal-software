import {CompoundValue} from "../../../interface";
import {EquationTypeDto} from "../../../dto";

export class NO implements CompoundValue{
    name: "Nitrogen oxide";
    chemicalFormula: "NO";
    Mr: 0.030006;
    enthalpyFormation298: 90.3e3;
    gibbsEnergy298:86.6e3;
    collisionDiameter: 4.495;
    epsilonToKb: 116.7;
    heatCapacity: {
        def: 2,
        values: [
            {
                type: EquationTypeDto.quartic,
                ref: 6,
                page: 53,
                vars: {
                    a:33.227,
                    b:-2.3626e-2,
                    c:5.3156e-5,
                    d:-3.7858e-8,
                    e:9.1197e-12,
                }
                min: 50,
                max: 1500,
            },
            {
                type: EquationTypeDto.quartic,
                ref: 4,
                page: 223,
                k: 1e-3,
                vars: {
                    c1: 0.3498e5,
                    c2: -35.32,
                    c3: 7.729e-2,
                    c4: -5.7357e-5,
                    c5: 1.4526e-8,
                },
                min: 100,
                max: 1500,
            },
            {
                type: EquationTypeDto.cubic,
                ref: 5,
                page: 911,
                vars: {
                    a:29.34,
                    b:-0.09395e-2,
                    c:0.9747e-5,
                    d:-4.187e-9,
                }
                min: 273,
                max: 1500,
            },
            {
                type: EquationTypeDto.linearHyperbolic,
                ref: 4,
                page: 206,
                vars: {
                    a: 8.05,
                    b: 0.000233,
                    d: -156300,
                },
                min: 300,
                max: 5000,
            },
        ]
    };
    viscosity: {
        def: 0,
        values:[
            {
                type: EquationTypeDto.quadratic,
                ref:6,
                page:475,
                k: 1e6,
                vars: {
                    a: 39.921,
                    b: 5.37e-1,
                    c: -1.24e-4,
                },
                min: 150,
                max: 1500,
            },
        ]
    };
}