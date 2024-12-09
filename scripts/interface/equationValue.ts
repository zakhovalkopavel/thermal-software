import {EquationTypeDto} from "../dto";

export interface EquationValue {
    type: EquationTypeDto,
    ref:number,
    page: number,
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    min: number,
    max: number,
}