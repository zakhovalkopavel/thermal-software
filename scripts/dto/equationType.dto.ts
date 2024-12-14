export enum EquationTypeDto {
    linear = "linear", //a+bT
    quadratic = "quadratic",//a+bT+cT2
    cubic = "cubic", //a+bT+cT2+dT3
    quartic = "quartic",//a+bT+cT2+dT3+eT4
    linearHyperbolic = "linearHyperbolic", // a+bT+c/T2
    linearHyperbolicLogarithmic = "linearHyperbolicLogarithmic", // c1 + c2lnT + c3/T + c4T
    alyLee ="alyLee", // c1 + c2×{(c3/T)/sinh(c3/T)}2 + c4×{(c5/T)/cosh(c5/T)}2
}