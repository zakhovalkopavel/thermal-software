import { Composition } from '../interface';
export class GasComposition {
    public readonly partial: Composition;
    public readonly mass: Composition;

    constructor(
        massN2: number, massO2: number, massCO2: number, massCO: number, massH2O: number, massH2: number
    ) {
        const molesTotal = massN2 / 28 + massO2 / 32 + massCO2 / 44 + massCO / 28 + massH2O / 18 + massH2 / 2;
        this.partial = {
            N2: massN2 / (28 * molesTotal),
            O2: massO2 / (32 * molesTotal),
            CO2: massCO2 / (44 * molesTotal),
            CO: massCO / (28 * molesTotal),
            H2O: massH2O / (28 * molesTotal),
            H2: massH2 / (28 * molesTotal),
        };
        this.mass = {
            N2: massN2,
            O2: massO2,
            CO2: massCO2,
            CO: massCO,
            H2O: massH2O,
            H2: massH2,
        };
    }
}