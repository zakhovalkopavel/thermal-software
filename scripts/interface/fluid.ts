import {CompoundValue} from "./compoundValue";
import {GasComposition} from "../thermalExchange";

export interface Fluid <T extends CompoundValue | GasComposition> {
    readonly fluid: T;
    readonly t: number; // fluid temperature, K
    readonly p: number; // fluid pressure, Pa
    readonly composition; // composition data

    kinematicViscosity(): number;
    dynamicViscosity(t1: number, t2?: number): number;
    thermalConductivity(): number;
    thermalDiffusivity(): number;
    heatCapacity(): number;
    density(): number;
    prandtlNumber(): number;
}