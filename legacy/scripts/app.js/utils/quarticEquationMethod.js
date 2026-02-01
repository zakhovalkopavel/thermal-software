"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuarticEquationMethod = void 0;
const common_1 = require("./common");
class QuarticEquationMethod {
    calculate(x, vars, min, max, k = 1) {
        const { a, b, c, d, e } = vars;
        x = common_1.Common.validInterval(x, min, max);
        return a + b * x + c * x * x + d * Math.pow(x, 3) + e * Math.pow(x, 4);
    }
    calculateAverage(x1, x2, vars, min, max, k = 1) {
        const v1 = this.integral(x1, vars, min, max);
        const v2 = this.integral(x2, vars, min, max);
        return (v2 - v1) / (x2 - x1);
    }
    integral(x, vars, min, max, k = 1) {
        const { a, b, c, d, e } = vars;
        x = common_1.Common.validInterval(x, min, max);
        return a * x + b * x * x / 2 + c * Math.pow(x, 3) / 3 + d * Math.pow(x, 4) / 4 + e * Math.pow(x, 5) / 5;
    }
}
exports.QuarticEquationMethod = QuarticEquationMethod;
//# sourceMappingURL=quarticEquationMethod.js.map