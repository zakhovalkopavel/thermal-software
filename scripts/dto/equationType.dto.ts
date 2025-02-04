export enum EquationTypeDto {
    linear = "linear", //a+bT
    quadratic = "quadratic",//a+bT+cT^2
    cubic = "cubic", //a+bT+cT^2+dT^3
    quartic = "quartic",//a+bT+cT^2+dT^3+eT^4
    linearHyperbolic = "linearHyperbolic", // a+bT+c/T^2
    linearHyperbolicLogarithmic = "linearHyperbolicLogarithmic", // c1 + c2lnT + c3/T + c4T
    alyLee ="alyLee", // c1 + c2×{(c3/T)/sinh(c3/T)}2 + c4×{(c5/T)/cosh(c5/T)}2
    dipprN102 = "dipprN102", // c1*T^c2/(1+c3/T+c4/T^2)
}