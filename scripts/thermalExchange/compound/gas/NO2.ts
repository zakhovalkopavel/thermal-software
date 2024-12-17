import {CompoundValue} from "../../../interface";
import {EquationTypeDto} from "../../../dto";

export class NO2 implements CompoundValue{
    name: "Nitrogen dioxide";
    chemicalFormula: "NO2";
    Mr: 0.046;
    enthalpyFormation298: 33.2e3;
    gibbsEnergy298:51.3e3;
    collisionDiameter: 3.765;
    epsilonToKb: 210;
    heatCapacity: {
        def:1,
        values: [
            {
                type: EquationTypeDto.quartic,
                ref: 6,
                page: 53,
                vars: {
                    a: 32.791,
                    b: -7.4294e-4,
                    c: 8.1722e-5,
                    d: -8.2872e-8,
                    e: 2.4424e-11,
                }
                min: 50,
                max: 1500,
            },
            {
                type: EquationTypeDto.cubic,
                ref: 5,
                page: 911,
                vars: {
                    a:22.9,
                    b:5.715e-2,
                    c:-3.52e-5,
                    d:7.87e-9,
                }
                min: 273,
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
                    a: -372.375,
                    b: 2.33,
                    c: -2.15e-3,
                },
                min: 295,
                max: 460,
            },
        ]
    };
}