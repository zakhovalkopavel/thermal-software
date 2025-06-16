import { FluidDto } from '../dto';
import {CompoundValue, Fluid} from '../interface';
import {GasComposition} from "./gasComposition";
import {ThermalConductivityEquationTypeDto} from "../dto/thermalConductivityEquationType.dto";
import {Common} from "../utils/common";

export class FluidConditionComposition implements Fluid<GasComposition>{
    public readonly fluid: GasComposition;
    public readonly t: number; // fluid temperature, K
    public readonly p: number; // fluid pressure, Pa
    public readonly composition; // composition data

    constructor(fluid: GasComposition, t: number, p: number) {
        this.fluid = fluid;
        this.t = t;
        this.p = p;
    }

    public kinematicViscosity(): number {
        return this.dynamicViscosity()/this.density();
    }

    // ref 7, 10-4
    public thermalConductivity(

        return result;
    }

    public heatCapacity(t1: number = this.t, t2?: number): number {

    }

    public dynamicViscosity(t: number = this.t): number {

    }


    public thermalDiffusivity(): number {
    }

    public density(): number {

    }

    public prandtlNumber(): number {
        return this.heatCapacity() * this.dynamicViscosity() / this.thermalConductivity();
    }
}