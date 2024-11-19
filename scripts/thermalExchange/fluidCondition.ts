import { FluidDto } from '../dto';
import {Composition} from '../interface';

export class FluidCondition {
    public readonly fluid: FluidDto; // fluid type
    public readonly t: number; // fluid temperature, K
    public readonly p: number; // fluid pressure, Pa
    public readonly composition; // composition data

    constructor(fluid: FluidDto, t: number, p: number, composition: Composition = null) {
        this.fluid = fluid;
        this.t = t;
        this.p = p
        this.composition = composition;
    }

    public kinematicViscosity(): number {
        return this.dynamicViscosity()/this.density();
    }

    public thermalConductivity(): number {
        let result;
        switch(this.fluid) {
            case FluidDto.air:
                result = 0.0244 * Math.pow(this.t / 273, 0.82);
                break;
            default:
                throw new Error("No default value of thermal conductivity");
                break;
        }
        return result;
    }

    public capacityIsobaric(): number {
        let result;
        switch(this.fluid){
            case FluidDto.air:
                result = (1.0005+1.1904*(this.t-273)/10000)*1000;
                break;
            default:
                throw new Error("No default value of capacity isobaric");
                break;
        }
        return result;
    }

    public dynamicViscosity(): number {
        let result;
        switch(this.fluid){
            case FluidDto.air:
                result = 1.717*Math.pow(this.t/273, 0.693)/100000;
                break;
            default:
                throw new Error("No default value of dynamic viscosity");
                break;
        }
        return result;
    }

    public density(): number {
        let result;
        switch (this.fluid) {
            case
            FluidDto
                .air:
                result = this.p / (287.4 * this.t);
                break;
            default:
                throw new Error("No default value of density");
                break;
        }
        return result;
    }

    public prandtlNumber(): number {
        return this.capacityIsobaric() * this.dynamicViscosity() / this.thermalConductivity();
    }
}