import {Equation} from "../interface";
import {LinearEquation} from "../type";
import {Common} from "./common";

export class LinearEquationMethod implements Equation<LinearEquation> {
    calculate(x: number, vars: LinearEquation, min: number, max:number, k:number = 1): number {
        const { a, b } = vars;
        x = Common.validInterval(x, min, max);
        return a + b*x;
    }

    calculateAverage(x1: number, x2, vars: LinearEquation, min: number, max:number, k:number = 1): number {
        const v1 = this.integral(x1, vars, min, max);
        const v2 = this.integral(x2, vars, min, max);
        return (v2-v1)/(x2-x1);
    }

    integral(x: number, vars: LinearEquation, min: number, max:number, k:number = 1): number {
        const { a, b } = vars;
        x = Common.validInterval(x, min, max);
        return a*x + b*x*x/2;
    }
}