"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FluidCondition = void 0;
const common_1 = require("../utils/common");
const thermalConductivityEquationType_dto_1 = require("../dto/thermalConductivityEquationType.dto");
class FluidCondition {
    constructor(fluid, t, p) {
        this.fluid = fluid;
        this.t = t;
        this.p = p;
    }
    kinematicViscosity() {
        return this.dynamicViscosity() / this.density();
    }
    // ref 7, 10-4
    thermalConductivity(t = this.t, method = thermalConductivityEquationType_dto_1.ThermalConductivityEquationTypeDto.stielThodos) {
        const viscosity = this.dynamicViscosity(t);
        const heatCapacityIsobaric = this.heatCapacity(t);
        const heatCapacityIsochoric = heatCapacityIsobaric - common_1.Common.R;
        let result;
        switch (method) {
            case thermalConductivityEquationType_dto_1.ThermalConductivityEquationTypeDto.eucken:
                result = viscosity * (heatCapacityIsochoric + 9 * common_1.Common.R / 4) / this.fluid.Mr;
                break;
            case thermalConductivityEquationType_dto_1.ThermalConductivityEquationTypeDto.modificatedEucken:
                result = viscosity * (1.32 * heatCapacityIsochoric + 1.77 * common_1.Common.R) / this.fluid.Mr;
                break;
            case thermalConductivityEquationType_dto_1.ThermalConductivityEquationTypeDto.stielThodos:
                result = viscosity * (1.15 * heatCapacityIsochoric + 2.03 * common_1.Common.R) / this.fluid.Mr;
                break;
        }
        return result;
    }
    heatCapacity(t1 = this.t, t2) {
        const heatCapacityValue = this.fluid.heatCapacity.values[this.fluid.viscosity.def];
        const { min, max, vars, k } = heatCapacityValue;
        const equation = common_1.Common.equation(heatCapacityValue.type);
        if (typeof t2 !== 'undefined') {
            return equation.calculateAverage(t1, t2, vars, min, max, k);
        }
        else {
            return equation.calculate(t1, vars, min, max, k);
        }
    }
    dynamicViscosity(t = this.t) {
        const viscosityValue = this.fluid.viscosity.values[this.fluid.viscosity.def];
        const { min, max, vars, k } = viscosityValue;
        if (t <= max && t >= min) {
            const equation = common_1.Common.equation(viscosityValue.type);
            return equation.calculate(t, vars, min, max, k);
        }
        else {
            return this.chapmanEnskogEquation(t);
        }
    }
    // ref 7, 9-4
    chapmanEnskogEquation(t) {
        const collisionIntegral = this.collisionIntegral(t);
        return 2.669e-6 * Math.pow(1000 * this.fluid.Mr * t, 0.5) / (Math.pow(this.fluid.collisionDiameter, 2) * collisionIntegral);
    }
    //ref 7, 9-5
    collisionIntegral(t) {
        const t1 = t / this.fluid.epsilonToKb;
        return 1.16145 * Math.pow(t1, -0.14874) + 0.52487 * Math.exp(-0.7732 * t1) + 2.16178 * Math.exp(-2.43783 * t1);
    }
    thermalDiffusivity() {
        return this.thermalConductivity() / (this.density() * this.heatCapacity());
    }
    density() {
        return this.p * this.fluid.Mr / (common_1.Common.R * this.t);
    }
    prandtlNumber() {
        return this.heatCapacity() * this.dynamicViscosity() / this.thermalConductivity();
    }
}
exports.FluidCondition = FluidCondition;
