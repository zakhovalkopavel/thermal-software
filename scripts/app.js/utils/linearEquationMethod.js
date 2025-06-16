"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinearEquationMethod = void 0;
const common_1 = require("./common");
class LinearEquationMethod {
    calculate(x, vars, min, max, k = 1) {
        const { a, b } = vars;
        x = common_1.Common.validInterval(x, min, max);
        return a + b * x;
    }
    calculateAverage(x1, x2, vars, min, max, k = 1) {
        const v1 = this.integral(x1, vars, min, max);
        const v2 = this.integral(x2, vars, min, max);
        return (v2 - v1) / (x2 - x1);
    }
    integral(x, vars, min, max, k = 1) {
        const { a, b } = vars;
        x = common_1.Common.validInterval(x, min, max);
        return a * x + b * x * x / 2;
    }
}
exports.LinearEquationMethod = LinearEquationMethod;
//# sourceMappingURL=linearEquationMethod.js.map