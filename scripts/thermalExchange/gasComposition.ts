import { Composition } from '../interface';
import {GasValue} from "../interface/compoundValue";
export class GasComposition {
    public readonly molPartial: Composition<number>; // partial composition by moles or volumes
    public readonly weightPartial: Composition<number>; // partial composition by mass
    /*
        Mr - molar weight kg/mol
        Isobaric Heat Capacity Coefficients :
        Cp,m (cubic) = a + b*T + c*T2 + d*T3
             (linearHyperbolic)= a + b*T + d*T-2

        Interval: from 300 to 1800 K.3
        Substances:
            a    J K-1 mol-1
            b    10-2 J K-2 mol-1
            c    10-5 J K-3 mol-1
            d    10-9 J K-4 mol-1
     */

    constructor(weightPartial: Composition<number>) {
        this.weightPartial = weightPartial;
        let molesTotal = 0;
        for(const [key, value] of Object.entries(weightPartial)){
            molesTotal += value * this.gasValues[key].Mr;
        }

        for(const [key, value] of Object.entries(weightPartial)){
            this.molPartial[key] = value / (this.gasValues[key].Mr * molesTotal);
        }
    }

    public heatCapacity(gasName: keyof Composition<number>, t: number, t0: number = -1) {
        let result = 0;
        if(t0<0){
            result = this.capacityFunction(gasName, t);
        }
        else {
            result = capacityFunctionAverage( vars[gas], t, t0);
        }
        return result;
    }

    //Molar isobaric heat capacity
    public capacityFunction ( gasName: keyof Composition<number>, t): number {
        t = this.capacityValidT(t);
        const {
            a, b, c, d, Mr
        } = this.gasValues[gasName];
        return (a + b*t/100 + c*Math.pow(t, 2)*Math.pow(10,-5) + d*Math.pow(t, 3)*Math.pow(10, -9))/Mr;
    }
    capacityFunctionAverage = ( gasName: keyof Composition<number>, t, t0) => {
        t0 = capacityValidInterval(t0);
        t = capacityValidInterval(t);
        if(t === t0) {
            return capacityFunction (vars, t0);
        }

        const {a, b, c, d, Mr} = vars;
        return Math.abs((a*(t-t0) + b*(t*t-t0*t0)/200 + c*(t*t*t-t0*t0*t0)*Math.pow(10,-5)/3 + d*(t*t*t*t-t0*t0*t0*t0)*Math.pow(10, -9)/4)/((t-t0)*Mr));
    };
    public capacityValidT(t: number): number {
        return t<this.tValidCMin ? this.tValidCMin : (t>this.tValidCMax ? this.tValidCMax : t);;
    }
}