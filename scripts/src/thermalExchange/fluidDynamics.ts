import { FluidDto, FormDto } from '../dto';
import { Composition } from '../interface';
import { FluidCondition } from './fluidCondition';
import { Common } from '../utils/common';

export class FluidDynamics {
    public readonly fluid: FluidDto;
    public readonly fluidCondition: FluidCondition;
    public readonly form: FormDto;
    public readonly direction;
    public readonly tFluid: number; // fluid temperature (sometimes for calculation we use average t between fluid and surface
    public readonly tSurface: number; // surface temperature
    public readonly p: number; // fluid pressure
    public readonly w: number; // fluid velocity
    public readonly a: number; // for example radius or length
    public readonly b: number; // for example height
    public readonly c: number;
    public readonly composition: Composition;
    public readonly characteristicSize: number;

    constructor(
        fluid: FluidDto,
        form: FormDto, direction,
        tFluid: number, tSurface: number,
        p: number, w: number,
        a: number, b: number, c: number,
        composition: Composition = null,) {
        this.fluid = fluid;
        this.form = form;
        this.direction = direction;
        this.tFluid = tFluid;
        this.tSurface = tSurface;
        this.p = p;
        this.w = w;
        this.a = a;
        this.b = b;
        this.c = c;
        this.composition = composition;
        this.fluidCondition = new FluidCondition(this.fluid, this.tFluid, this.p, this.composition);
        this.characteristicSize = this.getCharacteristicSize();
    }

    public getCharacteristicSize(): number {
        let result;
        switch (this.form) {
            default:
                result = this.a;
                break;
        }
        return result;
    }
    /**
     * Returns the Reynolds number.
     * The Reynolds number is the ratio of inertial forces to viscous forces within a fluid
     * that is subjected to relative internal movement due to different fluid velocities.

     * @param t - fluid temperature, K
     * @param w - fluid velocity, m/s
     * @param l - characteristic size, m
     * @returns The Reynolds number
     *
     */
    public ReynoldsNumber(): number {
        return this.w*this.characteristicSize/this.fluidCondition.kinematicViscosity();
    }

    // The Grashof Number is defined as a ratio of buoyant forces to viscous forces in fluid systems
    public grashofNumber (): number {
        let tHot, tCold;
        if(this.tSurface > this.tFluid){
            tHot = this.tSurface;
            tCold = this.tFluid;
        }
        else {
            tCold = this.tSurface;
            tHot = this.tFluid;
        }
        const fluidConditionCold = new FluidCondition(this.fluid, tCold, this.p, this.composition);
        const fluidConditionHot = new FluidCondition(this.fluid, tHot, this.p, this.composition);
        const averageViscosity = Common.logarithmicAverage(fluidConditionHot.kinematicViscosity(),fluidConditionCold.kinematicViscosity());
        return 9.81*Math.pow(this.characteristicSize, 3)*2*(tHot-tCold)/((tHot+tCold)*Math.pow(averageViscosity, 2));
        // TODO I have to check which characteristic size we use for different form and directions
    }

    //The Rayleigh number is defined as the strength of the thermal buoyancy against the viscous and thermal diffusion
    public rayleighNumber (): number {
        const tAverage = Common.average([this.tFluid, this.tSurface]);
        const fluidContitionAverageT = new FluidCondition(this.fluid, tAverage, this.p, this.composition);
        return fluidContitionAverageT.prandtlNumber()*this.grashofNumber();
    }
}