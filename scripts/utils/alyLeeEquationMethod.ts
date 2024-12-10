import {Equation} from "../interface";
import {AlyLeeEquation} from "../type";
import {Common} from "./common";

export class AlyLeeEquationMethod implements Equation<AlyLeeEquation> {
    calculate(x: number, vars: AlyLeeEquation, min: number, max:number, k:number = 1): number {
        const { c1, c2, c3, c4, c5 } = vars;
        x = Common.validInterval(x, min, max);
        return k*(c1 + c2*Math.pow(((c3/x)/Math.sinh(c3/x)), 2) + c4*Math.pow(((c5/x)/Math.cosh(c5/x)), 2));
    }

    calculateAverage(x1: number, x2, vars: AlyLeeEquation, min: number, max:number, k:number = 1): number {
        const v1 = this.integral(x1, vars, min, max, k);
        const v2 = this.integral(x2, vars, min, max, k);
        return (v2-v1)/(x2-x1);
    }

    integral(x: number, vars: AlyLeeEquation, min: number, max:number, k:number = 1): number {
        const { c1, c2, c3, c4, c5 } = vars;
        x = Common.validInterval(x, min, max);
        return k*(c1*x + c2*c3*Math.pow(Math.tanh(c3/x), -1) - c4*c5*Math.tanh(c5/x));
    }
}