import {Equation} from "../interface";
import {LinearHyperbolicEquation} from "../type";
import {Common} from "./common";

export class LinearHyperbolicEquationMethod implements Equation<LinearHyperbolicEquation> {
    calculate(x: number, vars: LinearHyperbolicEquation, min: number, max:number, k:number = 1): number {
        const { a, b, d } = vars;
        x = Common.validInterval(x, min, max);
        return a + b*x + d*Math.pow(x,-2);
    }

    calculateAverage(x1: number, x2, vars: LinearHyperbolicEquation, min: number, max:number, k:number = 1): number {
        const v1 = this.integral(x1, vars, min, max);
        const v2 = this.integral(x2, vars, min, max);
        return (v2-v1)/(x2-x1);
    }

    integral(x: number, vars: LinearHyperbolicEquation, min: number, max:number, k:number = 1): number {
        const { a, b, d } = vars;
        x = Common.validInterval(x, min, max);
        return a*x + b*x*x/2 - d/x;
    }
}