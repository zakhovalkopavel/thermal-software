import {
    AlyLeeEquation,
    CubicEquation,
    LinearEquation,
    LinearHyperbolicEquation,
    LinearHyperbolicLogarithmicEquation,
    QuadraticEquation,
    QuarticEquation
} from "../type";
import {EquationTypeDto} from "../dto";
import {LinearEquationMethod} from "./linearEquationMethod";
import {AlyLeeEquationMethod} from "./alyLeeEquationMethod";
import {LinearHyperbolicEquationMethod} from "./linearHyperbolicEquationMethod";
import {LinearHyperbolicLogarithmicEquationMethod} from "./linearHyperbolicLogarithmicEquationMethod";
import {QuadraticEquationMethod} from "./quadraticEquationMethod";
import {CubicEquationMethod} from "./cubicEquationMethod";
import {QuarticEquationMethod} from "./quarticEquationMethod";

export class Common {
    public static kB: number = 1.380649e-23; // Boltzmann's constant J/K;
    public static R: number =8.31446261815324; // The molar gas constant , J/(mol*K)
    public static Na: number = 6.02214076e23 // The Avogadro constant mol−1

    public static logarithmicAverage(x1: number, x2: number): number {
        if (x1 < 0 || x2 < 0) {
            throw new Error("For method getLogarithmicAverage both arguments must be >= 0")
        } else if (x1 === x2) {
            return x1;
        } else if (x1 === 0 || x2 === 0) {
            return 0;
        } else {
            return (x1 - x2) / Math.log(x1 / x2);
        }
    }

    public static average(data: number[]): number {
        return data.reduce((accumulator, current) => accumulator + current) / data.length;
    }

    public static rootMeanSquare(data: number[]): number {
        return Math.pow(data.reduce((accumulator, current) => accumulator + current * current) / data.length, 0.5);
    }

    public static validInterval(x: number, min: number, max: number): number {
        return x < min ? min : (x > max) ? max : x;
    }

    public static isValidInterval(x: number, min: number, max: number): boolean {
        return x >= min && x <= max ? true : false;
    }

    public static equation(equationType: EquationTypeDto) {
        let result;
        switch (equationType){
            case EquationTypeDto.alyLee:
                result = new AlyLeeEquationMethod();
                break;
            case EquationTypeDto.linear:
                result = new LinearEquationMethod();
                break;
            case EquationTypeDto.linearHyperbolic:
                result = new LinearHyperbolicEquationMethod();
                break;
            case EquationTypeDto.linearHyperbolicLogarithmic:
                result = new LinearHyperbolicLogarithmicEquationMethod();
                break;
            case EquationTypeDto.quadratic:
                result = new QuadraticEquationMethod();
                break;
            case EquationTypeDto.cubic:
                result = new CubicEquationMethod();
                break;
            case EquationTypeDto.quartic:
                result = new QuarticEquationMethod();
                break;
        }
        return result;
    }

}