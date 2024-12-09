"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlyLeeEquationMethod = void 0;
const common_1 = require("./common");
class AlyLeeEquationMethod {
    calculate(x, vars, min, max) {
        const { c1, c2, c3, c4, c5 } = vars;
        x = common_1.Common.validInterval(x, min, max);
        return c1 + c2 * Math.pow(((c3 / x) / Math.sinh(c3 / x)), 2) + c4 * Math.pow(((c5 / x) / Math.cosh(c5 / x)), 2);
    }
    calculateAverage(x1, x2, vars, min, max) {
        const v1 = this.integral(x1, vars, min, max);
        const v2 = this.integral(x2, vars, min, max);
        return (v2 - v1) / (x2 - x1);
    }
    integral(x, vars, min, max) {
        const { c1, c2, c3, c4, c5 } = vars;
        x = common_1.Common.validInterval(x, min, max);
        return c1 * x + c2 * c3 * Math.pow(Math.tanh(c3 / x), -1) - c4 * c5 * Math.tanh(c5 / x);
    }
}
exports.AlyLeeEquationMethod = AlyLeeEquationMethod;
