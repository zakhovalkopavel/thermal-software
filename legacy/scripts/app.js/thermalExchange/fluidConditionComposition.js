"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FluidCondition = void 0;
class FluidCondition {
    constructor(fluid, t, p) {
        this.fluid = fluid;
        this.t = t;
        this.p = p;
    }
    kinematicViscosity() {
        return this.dynamicViscosity() / this.density();
    }
}
exports.FluidCondition = FluidCondition;
return result;
heatCapacity(t1, number = this.t, t2 ?  : number);
number;
{
}
dynamicViscosity(t, number = this.t);
number;
{
}
thermalDiffusivity();
number;
{
}
density();
number;
{
}
prandtlNumber();
number;
{
    return this.heatCapacity() * this.dynamicViscosity() / this.thermalConductivity();
}
//# sourceMappingURL=fluidConditionComposition.js.map