import {CompoundValue} from "../../../interface";
import {EquationTypeDto} from "../../../dto";

export class N2 implements CompoundValue{
    name: "Nitrogen";
    chemicalFormula: "N2";
    Mr: 0.028;
    enthalpyFormation298: 0;
    gibbsEnergy298:0;
    collisionDiameter: 3.798;
    epsilonToKb: 71.4;
    heatCapacity: {
        def:1,
        values:[
            {
                type: EquationTypeDto.quartic,
                ref:6,
                page:53,
                vars: {
                    a: 29.342,
                    b: -3.5395e-3,
                    c: 1.0076e-5,
                    d: -4.3116e-9,
                    e: 2.5935e-13,
                }
                min: 50,
                max: 1500,
            },
            {
                type: EquationTypeDto.cubic,
                ref:5,
                page:911,
                vars: {
                    a: 28.9,
                    b: -0.1571e-2,
                    c: 0.8081e-5,
                    d: -2.873e-9,
                }
                min: 273,
                max: 1800,
            },
            {
                type: EquationTypeDto.linear,
                ref:1,
                page:268,
                vars: {
                    a: 27.88,
                    b: 4.27e-3,
                }
                min: 298,
                max: 2500,
            },
            {
                type: EquationTypeDto.linear,
                ref:4,
                page:206,
                vars: {
                    a: 6.5,
                    b: 0.001,
                }
                min: 300,
                max: 3000,
            },
            {
                type: EquationTypeDto.alyLee,
                ref: 4,
                page: 223,
                k: 1e-3,
                vars: {
                    c1: 0.2911e5,
                    c2: 0.0861e5,
                    c3: 1.7016e3,
                    c4: 0.001e5,
                    c5: 909.79,
                },
                min: 50,
                max: 1500,
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
                    a: 42.606,
                    b: 4.75e-1,
                    c: -9.88e-5,
                },
                min: 150,
                max: 1500,
            },
        ]
    };
}