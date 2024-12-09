export enum EquationTypeDto {
    linear = "linear", //a+bT
    quadratic = "quadratic",//a+bT+cT2
    cubic = "cubic", //a+bT+cT2+dT3
    quartic = "quartic",//a+bT+cT2+dT3+eT4
    linearHyperbolic = "linearHyperbolic", // a+bT+c/T2
    alyLee ="alyLee", // a + b×{(c/T)/sinh(c/T)}2 + d×{(e/T)/cosh(e/T)}2
}