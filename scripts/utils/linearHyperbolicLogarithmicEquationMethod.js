"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinearHyperbolicLogarithmicEquationMethod = void 0;
const common_1 = require("./common");
class LinearHyperbolicLogarithmicEquationMethod {
    calculate(x, vars, min, max, k = 1) {
        const { c1, c2, c3, c4 } = vars;
        x = common_1.Common.validInterval(x, min, max);
        return k * (c1 + c2 * Math.log(x) + c3 / x + c4 * x);
    }
    calculateAverage(x1, x2, vars, min, max, k = 1) {
        const v1 = this.integral(x1, vars, min, max, k);
        const v2 = this.integral(x2, vars, min, max, k);
        return (v2 - v1) / (x2 - x1);
    }
    integral(x, vars, min, max, k = 1) {
        const { c1, c2, c3, c4 } = vars;
        x = common_1.Common.validInterval(x, min, max);
        return k * (c1 * x + c2 * (x * Math.log(x) - x) + c3 * Math.log(x) + c4 * x * x / 2);
    }
}
exports.LinearHyperbolicLogarithmicEquationMethod = LinearHyperbolicLogarithmicEquationMethod;
