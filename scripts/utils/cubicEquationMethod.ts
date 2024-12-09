import {Equation} from "../interface";
import {CubicEquation} from "../type";
import {Common} from "./common";

export class CubicEquationMethod implements Equation<CubicEquation> {
    calculate(x: number, vars: CubicEquation, min, max): number {
        const { a, b, c, d } = vars;
        x = Common.validInterval(x, min, max);
        return a + b*x + c*x*x + d*Math.pow(x, 3);
    }

    calculateAverage(x1: number, x2, vars: CubicEquation, min, max): number {
        const v1 = this.integral(x1, vars, min, max);
        const v2 = this.integral(x2, vars, min, max);
        return (v2-v1)/(x2-x1);
    }

    integral(x: number, vars: CubicEquation, min, max): number {
        const { a, b, c, d } = vars;
        x = Common.validInterval(x, min, max);
        return a*x + b*x*x/2 + c*Math.pow(x, 3)/3 + d*Math.pow(x, 4)/4;
    }
}