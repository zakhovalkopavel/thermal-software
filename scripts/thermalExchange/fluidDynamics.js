"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FluidDynamics = void 0;
const fluidCondition_1 = require("./fluidCondition");
const common_1 = require("../utils/common");
class FluidDynamics {
    constructor(fluid, form, direction, tFluid, tSurface, p, w, a, b, c, composition = null) {
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
        this.fluidCondition = new fluidCondition_1.FluidCondition(this.fluid, this.tFluid, this.p, this.composition);
        this.characteristicSize = this.getCharacteristicSize();
    }
    getCharacteristicSize() {
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
    ReynoldsNumber() {
        return this.w * this.characteristicSize / this.fluidCondition.kinematicViscosity();
    }
    // The Grashof Number is defined as a ratio of buoyant forces to viscous forces in fluid systems
    grashofNumber() {
        let tHot, tCold;
        if (this.tSurface > this.tFluid) {
            tHot = this.tSurface;
            tCold = this.tFluid;
        }
        else {
            tCold = this.tSurface;
            tHot = this.tFluid;
        }
        const fluidConditionCold = new fluidCondition_1.FluidCondition(this.fluid, tCold, this.p, this.composition);
        const fluidConditionHot = new fluidCondition_1.FluidCondition(this.fluid, tHot, this.p, this.composition);
        const averageViscosity = common_1.Common.logarithmicAverage(fluidConditionHot.kinematicViscosity(), fluidConditionCold.kinematicViscosity());
        return 9.81 * Math.pow(this.characteristicSize, 3) * 2 * (tHot - tCold) / ((tHot + tCold) * Math.pow(averageViscosity, 2));
        // TODO I have to check which characteristic size we use for different form and directions
    }
    //The Rayleigh number is defined as the strength of the thermal buoyancy against the viscous and thermal diffusion
    rayleighNumber() {
        const tAverage = common_1.Common.average([this.tFluid, this.tSurface]);
        const fluidContitionAverageT = new fluidCondition_1.FluidCondition(this.fluid, tAverage, this.p, this.composition);
        return fluidContitionAverageT.prandtlNumber() * this.grashofNumber();
    }
}
exports.FluidDynamics = FluidDynamics;
