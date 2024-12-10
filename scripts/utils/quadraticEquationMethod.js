"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuadraticEquationMethod = void 0;
const common_1 = require("./common");
class QuadraticEquationMethod {
    calculate(x, vars, min, max, k = 1) {
        const { a, b, c } = vars;
        x = common_1.Common.validInterval(x, min, max);
        return a + b * x + c * x * x;
    }
    calculateAverage(x1, x2, vars, min, max, k = 1) {
        const v1 = this.integral(x1, vars, min, max);
        const v2 = this.integral(x2, vars, min, max);
        return (v2 - v1) / (x2 - x1);
    }
    integral(x, vars, min, max, k = 1) {
        const { a, b, c } = vars;
        x = common_1.Common.validInterval(x, min, max);
        return a * x + b * x * x / 2 + c * Math.pow(x, 3) / 3;
    }
}
exports.QuadraticEquationMethod = QuadraticEquationMethod;
