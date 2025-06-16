import {Equation} from "../interface";
import {QuarticEquation} from "../type";
import {Common} from "./common";

export class QuarticEquationMethod implements Equation<QuarticEquation> {
    calculate(x: number, vars: QuarticEquation, min: number, max:number, k:number = 1): number {
        const { a, b, c, d, e } = vars;
        x = Common.validInterval(x, min, max);
        return a + b*x + c*x*x + d*Math.pow(x, 3) + e*Math.pow(x, 4);
    }

    calculateAverage(x1: number, x2, vars: QuarticEquation, min: number, max:number, k:number = 1): number {
        const v1 = this.integral(x1, vars, min, max);
        const v2 = this.integral(x2, vars, min, max);
        return (v2-v1)/(x2-x1);
    }

    integral(x: number, vars: QuarticEquation, min: number, max:number, k:number = 1): number {
        const { a, b, c, d, e } = vars;
        x = Common.validInterval(x, min, max);
        return a*x + b*x*x/2 + c*Math.pow(x, 3)/3 + d*Math.pow(x, 4)/4 + e*Math.pow(x, 5)/5;
    }
}