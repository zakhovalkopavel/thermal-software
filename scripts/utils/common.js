"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Common = void 0;
class Common {
    static logarithmicAverage(x1, x2) {
        if (x1 < 0 || x2 < 0) {
            throw new Error("For method getLogarithmicAverage both arguments must be >= 0");
        }
        else if (x1 === x2) {
            return x1;
        }
        else if (x1 === 0 || x2 === 0) {
            return 0;
        }
        else {
            return (x1 - x2) / Math.log(x1 / x2);
        }
    }
    static average(data) {
        return data.reduce((accumulator, current) => accumulator + current) / data.length;
    }
    static rootMeanSquare(data) {
        return Math.pow(data.reduce((accumulator, current) => accumulator + current * current) / data.length, 0.5);
    }
    static validInterval(x, min, max) {
        return x < min ? min : (x > max) ? max : x;
    }
    static isValidInterval(x, min, max) {
        return x >= min && x <= max ? true : false;
    }
}
exports.Common = Common;
