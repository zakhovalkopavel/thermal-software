import {Equation} from "../interface";
import {DipprN102Equation} from "../type";
import {Common} from "./common";

//The same as DIPPR Equation #102 from ref 16
export class DipprEquation102Method implements Equation<DipprN102Equation> {
    calculate(x: number, vars: DipprN102Equation, min: number, max:number, k:number = 1): number {
        const { c1, c2, c3, c4 } = vars;
        x = Common.validInterval(x, min, max);
        return k*(c1*Math.pow(x,c2)/(1+c3/x+c4/(x*x)));
    }

    calculateAverage(x1: number, x2, vars: DipprN102Equation, min: number, max:number, k:number = 1): number {
        const v1 = this.integral(x1, vars, min, max, k);
        const v2 = this.integral(x2, vars, min, max, k);
        return (v2-v1)/(x2-x1);
    }

    integral(x: number, vars: DipprN102Equation, min: number, max:number, k:number = 1): number {
        const { c1, c2, c3, c4 } = vars;
        x = Common.validInterval(x, min, max);
        // Integral solution was taken from ref 17
        const y = c3*c3-4*c4;
        const ySqrt = Math.pow(y, 0.5);
        const gaussian1 = Common.gaussian(1, c2+1, c2+2, 2*x/(ySqrt-c3));
        const gaussian2 = Common.gaussian(1, c2+1, c2+2, -2*x/(ySqrt+c3));
        return k*(
            c1*Math.pow(x,c2+1)*(
                (-c3*ySqrt+y)*gaussian1 + (c3*ySqrt+y)*gaussian2 - 2*y
            )/(2*(c2+1)*y)
        );
    }
}