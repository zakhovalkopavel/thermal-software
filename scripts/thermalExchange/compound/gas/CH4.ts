import {CompoundValue} from "../../../interface";
import {EquationTypeDto} from "../../../dto";

export class CH4 implements CompoundValue{
    name: "Methane";
    chemicalFormula: "CH4";
    Mr: 0.016043;
    enthalpyFormation298: -74.85e3;
    gibbsEnergy298:-50.84e3;
    collisionDiameter:3.758;
    epsilonToKb: 148.6;
    gibbsEnergy: {
        reagents: ["C","H2"],
        value: {
            type: EquationTypeDto.quadratic,
            ref:6,
            page:320,
            k: 1000,
            vars: {
                a: -75.262,
                b: 7.5925e-2,
                c: 1.87e-5,
            },
            min: 298,
            max: 1000,
        }
    };
    heatCapacity: {
        def: 1,
        values:[
            {
                type: EquationTypeDto.quartic,
                ref:6,//2
                page:33,//834
                vars: {
                    a: 34.942,
                    b: -3.9957e-2,
                    c: 1.9184e-4,
                    d: -1.5303e-7,
                    e: 3.9321e-11,
                },
                min: 50,
                max: 1500,
            },
            {
                type: EquationTypeDto.cubic,
                ref:5,
                page:911,
                vars: {
                    a: 19.89,
                    b: 5.024e-2,
                    c: 1.269e-5,
                    d: -11.01e-9,
                },
                min: 273,
                max: 1500,
            },
            {
                type: EquationTypeDto.alyLee,
                ref:4,
                page:219,
                k:1e-3,
                vars:{
                    c1:0.333e5,
                    c2:0.7993e5,
                    c3:2.0869e3,
                    c4:0.416e5,
                    c5:991.96,
                }
                min: 50,
                max: 1500,
            },
            {
                type: EquationTypeDto.linear,
                ref:4,
                page:203,
                vars: {
                    a: 5.34,
                    b: 0.0115,
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
                    a: 3.844,
                    b: 4.0112e-1,
                    c: -1.4303e-4,
                },
                min: 91,
                max: 850,
            },
        ]
    };
}