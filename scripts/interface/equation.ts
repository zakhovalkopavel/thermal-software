import {AlyLeeEquation, LinearHyperbolicEquation, LinearEquation, QuadraticEquation, QuarticEquation, CubicEquation} from "../type";

export interface Equation<Equ extends AlyLeeEquation | LinearHyperbolicEquation | LinearEquation
    | QuadraticEquation | QuarticEquation | CubicEquation > {
    calculate(x: number, vars: Equ, min, max): number,
    calculateAverage(x1: number, x2, vars: Equ, min, max): number,
    integral(x: number, vars: Equ, min, max): number,
}