"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DipprEquation102Method = void 0;
const common_1 = require("./common");
//The same as DIPPR Equation #102 from ref 16
class DipprEquation102Method {
    calculate(x, vars, min, max, k = 1) {
        const { c1, c2, c3, c4 } = vars;
        x = common_1.Common.validInterval(x, min, max);
        return k * (c1 * Math.pow(x, c2) / (1 + c3 / x + c4 / (x * x)));
    }
    calculateAverage(x1, x2, vars, min, max, k = 1) {
        const v1 = this.integral(x1, vars, min, max, k);
        const v2 = this.integral(x2, vars, min, max, k);
        return (v2 - v1) / (x2 - x1);
    }
    integral(x, vars, min, max, k = 1) {
        const { c1, c2, c3, c4 } = vars;
        x = common_1.Common.validInterval(x, min, max);
        // Integral solution was taken from ref 17
        const y = c3 * c3 - 4 * c4;
        const ySqrt = Math.pow(y, 0.5);
        const gaussian1 = common_1.Common.gaussian(1, c2 + 1, c2 + 2, 2 * x / (ySqrt - c3));
        const gaussian2 = common_1.Common.gaussian(1, c2 + 1, c2 + 2, -2 * x / (ySqrt + c3));
        return k * (c1 * Math.pow(x, c2 + 1) * ((-c3 * ySqrt + y) * gaussian1 + (c3 * ySqrt + y) * gaussian2 - 2 * y) / (2 * (c2 + 1) * y));
    }
}
exports.DipprEquation102Method = DipprEquation102Method;
//# sourceMappingURL=dipprEquation102.js.map