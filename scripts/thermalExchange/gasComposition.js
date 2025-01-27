"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GasComposition = void 0;
class GasComposition {
    constructor(weightPartial) {
        this.capacityFunctionAverage = (gasName, t, t0) => {
            t0 = capacityValidInterval(t0);
            t = capacityValidInterval(t);
            if (t === t0) {
                return capacityFunction(vars, t0);
            }
            const { a, b, c, d, Mr } = vars;
            return Math.abs((a * (t - t0) + b * (t * t - t0 * t0) / 200 + c * (t * t * t - t0 * t0 * t0) * Math.pow(10, -5) / 3 + d * (t * t * t * t - t0 * t0 * t0 * t0) * Math.pow(10, -9) / 4) / ((t - t0) * Mr));
        };
        this.weightPartial = weightPartial;
        let molesTotal = 0;
        for (const [key, value] of Object.entries(weightPartial)) {
            molesTotal += value * this.gasValues[key].Mr;
        }
        for (const [key, value] of Object.entries(weightPartial)) {
            this.molPartial[key] = value / (this.gasValues[key].Mr * molesTotal);
        }
    }
    heatCapacity(gasName, t, t0 = -1) {
        let result = 0;
        if (t0 < 0) {
            result = this.capacityFunction(gasName, t);
        }
        else {
            result = capacityFunctionAverage(vars[gas], t, t0);
        }
        return result;
    }
    //Molar isobaric heat capacity
    capacityFunction(gasName, t) {
        t = this.capacityValidT(t);
        const { a, b, c, d, Mr } = this.gasValues[gasName];
        return (a + b * t / 100 + c * Math.pow(t, 2) * Math.pow(10, -5) + d * Math.pow(t, 3) * Math.pow(10, -9)) / Mr;
    }
    capacityValidT(t) {
        return t < this.tValidCMin ? this.tValidCMin : (t > this.tValidCMax ? this.tValidCMax : t);
        ;
    }
}
exports.GasComposition = GasComposition;
