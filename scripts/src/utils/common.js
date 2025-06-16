"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Common = void 0;
const dto_1 = require("../dto");
const linearEquationMethod_1 = require("./linearEquationMethod");
const alyLeeEquationMethod_1 = require("./alyLeeEquationMethod");
const linearHyperbolicEquationMethod_1 = require("./linearHyperbolicEquationMethod");
const linearHyperbolicLogarithmicEquationMethod_1 = require("./linearHyperbolicLogarithmicEquationMethod");
const quadraticEquationMethod_1 = require("./quadraticEquationMethod");
const cubicEquationMethod_1 = require("./cubicEquationMethod");
const quarticEquationMethod_1 = require("./quarticEquationMethod");
const dipprEquation102_1 = require("./dipprEquation102");
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
    static equation(equationType) {
        let result;
        switch (equationType) {
            case dto_1.EquationTypeDto.alyLee:
                result = new alyLeeEquationMethod_1.AlyLeeEquationMethod();
                break;
            case dto_1.EquationTypeDto.linear:
                result = new linearEquationMethod_1.LinearEquationMethod();
                break;
            case dto_1.EquationTypeDto.linearHyperbolic:
                result = new linearHyperbolicEquationMethod_1.LinearHyperbolicEquationMethod();
                break;
            case dto_1.EquationTypeDto.linearHyperbolicLogarithmic:
                result = new linearHyperbolicLogarithmicEquationMethod_1.LinearHyperbolicLogarithmicEquationMethod();
                break;
            case dto_1.EquationTypeDto.dipprN102:
                result = new dipprEquation102_1.DipprEquation102Method();
                break;
            case dto_1.EquationTypeDto.quadratic:
                result = new quadraticEquationMethod_1.QuadraticEquationMethod();
                break;
            case dto_1.EquationTypeDto.cubic:
                result = new cubicEquationMethod_1.CubicEquationMethod();
                break;
            case dto_1.EquationTypeDto.quartic:
                result = new quarticEquationMethod_1.QuarticEquationMethod();
                break;
        }
        return result;
    }
    static pochhammerFunction(x, n, current) {
        if (n == 0) {
            return 1;
        }
        else if (typeof current === "number") {
            return current * (x + n - 1);
        }
        else {
            return (x + n - 1) * Common.pochhammerFunction(x, n - 1);
        }
    }
    ;
    static factorial(n, current) {
        if (n == 0) {
            return 1;
        }
        else if (typeof current === "number") {
            return current * n;
        }
        else {
            return n * Common.factorial(n - 1);
        }
    }
    static gaussian(a, b, c, z) {
        let a_n, b_n, c_n, factorial_n;
        a_n = b_n = c_n = factorial_n = 1;
        let result = 0;
        for (let n = 0; n < Common.gaussianSteps; n++) {
            a_n = Common.pochhammerFunction(a, n, a_n);
            b_n = Common.pochhammerFunction(a, n, b_n);
            b_n = Common.pochhammerFunction(a, n, c_n);
            factorial_n = Common.factorial(n, factorial_n);
            result += a_n * b_n * Math.pow(z, n) / (c_n * factorial_n);
        }
        return result;
    }
}
exports.Common = Common;
Common.kB = 1.380649e-23; // Boltzmann's constant J/K;
Common.R = 8.31446261815324; // The molar gas constant , J/(mol*K)
Common.Na = 6.02214076e23; // The Avogadro constant mol−1
Common.gaussianSteps = 20;
