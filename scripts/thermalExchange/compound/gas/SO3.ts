import {CompoundValue} from "../../../interface";
import {EquationTypeDto} from "../../../dto";

export class SO3 implements CompoundValue{
    name: "Sulfur trioxide";
    chemicalFormula: "SO3";
    Mr: 0.080064;
    enthalpyFormation298: -395.7e3;
    gibbsEnergy298:-371.1e3;
    //σ (collision diameter) and ε/k from method of  Patrick and Golden (1983), ref
    collisionDiameter: 4.19; // 1.18Vb^(1/3) => Vb=Mr/(ρb*NA), ρb = 1806.8kg/m3
    epsilonToKb: 384.8; // =1.21Tb, Tb=318K
    heatCapacity: {
        def: 1,
        values: [
            {
                type: EquationTypeDto.quartic,
                ref: 6,
                page: 54,
                vars:
                    {
                        a:22.466,
                        b:1.1981e-1,
                        c:-9.0842e-5,
                        d:2.5503e-8,
                        e:-7.9208e-13,
                    }
                min: 100,
                max: 1500,
            },
            {
                type: EquationTypeDto.cubic,
                ref: 5,
                page: 911,
                vars: {
                    a: 16.4,
                    b: 14.58e-2,
                    c: -11.2e-5,
                    d: 32.42e-9,
                }
                min: 273,
                max: 1300,
            },
            {
                type: EquationTypeDto.alyLee,
                ref: 4,
                page: 223,
                k: 1e-3,
                vars: {
                    c1: 0.3341e5,
                    c2: 0.4968e5,
                    c3: 0.8732e3,
                    c4: 0.2856e5,
                    c5: 393.74,
                },
                min: 100,
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
                page:476,
                k: 1e6,
                vars: {
                    a: -12.039,
                    b: 5.43e-1,
                    c: -1.6e-4,
                },
                min: 298,
                max: 694,
            },
        ]
    };
}