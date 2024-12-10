import {EquationTypeDto} from "../dto";
import {AlyLeeEquation, LinearHyperbolicEquation, LinearEquation, QuadraticEquation, QuarticEquation, CubicEquation} from "../type";

export interface EquationValue {
    type: EquationTypeDto,
    ref:number,
    page: number,
    k?: number,
    vars: AlyLeeEquation | LinearHyperbolicEquation | LinearEquation | QuadraticEquation | CubicEquation | QuarticEquation,
    min: number,
    max: number,
}