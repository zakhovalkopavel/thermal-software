"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FluidCondition = void 0;
const dto_1 = require("../dto");
class FluidCondition {
    constructor(fluid, t, p, composition = null) {
        this.fluid = fluid;
        this.t = t;
        this.p = p;
        this.composition = composition;
    }
    kinematicViscosity() {
        return this.dynamicViscosity() / this.density();
    }
    thermalConductivity() {
        let result;
        switch (this.fluid) {
            case dto_1.FluidDto.air:
                result = 0.0244 * Math.pow(this.t / 273, 0.82);
                break;
            default:
                throw new Error("No default value of thermal conductivity");
                break;
        }
        return result;
    }
    capacityIsobaric() {
        let result;
        switch (this.fluid) {
            case dto_1.FluidDto.air:
                result = (1.0005 + 1.1904 * (this.t - 273) / 10000) * 1000;
                break;
            default:
                throw new Error("No default value of capacity isobaric");
                break;
        }
        return result;
    }
    dynamicViscosity() {
        let result;
        switch (this.fluid) {
            case dto_1.FluidDto.air:
                result = 1.717 * Math.pow(this.t / 273, 0.693) / 100000;
                break;
            default:
                throw new Error("No default value of dynamic viscosity");
                break;
        }
        return result;
    }
    density() {
        let result;
        switch (this.fluid) {
            case dto_1.FluidDto
                .air:
                result = this.p / (287.4 * this.t);
                break;
            default:
                throw new Error("No default value of density");
                break;
        }
        return result;
    }
    prandtlNumber() {
        return this.capacityIsobaric() * this.dynamicViscosity() / this.thermalConductivity();
    }
}
exports.FluidCondition = FluidCondition;
