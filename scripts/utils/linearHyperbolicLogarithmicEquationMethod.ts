import {Equation} from "../interface";
import { LinearHyperbolicLogarithmicEquation} from "../type";
import {Common} from "./common";

export class LinearHyperbolicLogarithmicEquationMethod implements Equation<LinearHyperbolicLogarithmicEquation> {
    calculate(x: number, vars: LinearHyperbolicLogarithmicEquation, min: number, max:number, k:number = 1): number {
        const { c1, c2, c3, c4 } = vars;
        x = Common.validInterval(x, min, max);
        return k*(c1 + c2*Math.log(x) + c3/x + c4*x);
    }

    calculateAverage(x1: number, x2, vars: LinearHyperbolicLogarithmicEquation, min: number, max:number, k:number = 1): number {
        const v1 = this.integral(x1, vars, min, max, k);
        const v2 = this.integral(x2, vars, min, max, k);
        return (v2-v1)/(x2-x1);
    }

    integral(x: number, vars: LinearHyperbolicLogarithmicEquation, min: number, max:number, k:number = 1): number {
        const { c1, c2, c3, c4 } = vars;
        x = Common.validInterval(x, min, max);
        return k*(c1*x + c2*(x*Math.log(x) - x) + c3*Math.log(x) + c4*x*x/2);
    }
}