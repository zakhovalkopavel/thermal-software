export interface Equation<Equ> {
    calculate(x: number, vars: Equ, min: number, max: number, k?:number): number,
    calculateAverage(x1: number, x2: number, vars: Equ, min:number, max:number, k?:number): number,
    integral(x: number, vars: Equ, min:number, max:number, k?:number): number,
}