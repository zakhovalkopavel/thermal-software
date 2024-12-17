import {CompoundValue, Fluid} from '../interface';
import {Common} from "../utils/common";
import {ThermalConductivityEquationTypeDto} from "../dto/thermalConductivityEquationType.dto";

export class FluidCondition implements Fluid<CompoundValue>{
    public readonly fluid: CompoundValue;
    public readonly t: number; // fluid temperature, K
    public readonly p: number; // fluid pressure, Pa
    public readonly composition; // composition data

    constructor(fluid: CompoundValue, t: number, p: number) {
        this.fluid = fluid;
        this.t = t;
        this.p = p;
    }



    public kinematicViscosity(): number {
        return this.dynamicViscosity()/this.density();
    }

    // ref 7, 10-4
    public thermalConductivity(
       t:number = this.t,
       method: ThermalConductivityEquationTypeDto = ThermalConductivityEquationTypeDto.stielThodos): number {
        const viscosity = this.dynamicViscosity(t);
        const heatCapacityIsobaric = this.heatCapacity(t);
        const heatCapacityIsochoric = heatCapacityIsobaric - Common.R;
        let result: number;
        switch (method) {
            case ThermalConductivityEquationTypeDto.eucken:
                result = viscosity*(heatCapacityIsochoric + 9*Common.R/4)/this.fluid.Mr;
                break;
            case ThermalConductivityEquationTypeDto.modificatedEucken:
                result = viscosity*(1.32*heatCapacityIsochoric + 1.77*Common.R)/this.fluid.Mr;
                break;
            case ThermalConductivityEquationTypeDto.stielThodos:
                result = viscosity*(1.15*heatCapacityIsochoric + 2.03*Common.R)/this.fluid.Mr;
                break;
        }
        return result;
    }

    public heatCapacity(t1: number = this.t, t2?: number): number {
        const heatCapacityValue = this.fluid.heatCapacity.values[this.fluid.viscosity.def];
        const {min, max, vars, k} = heatCapacityValue;
        const equation = Common.equation(heatCapacityValue.type);
        if(typeof t2 !== 'undefined') {
            return equation.calculateAverage(t1, t2, vars, min, max, k);
        }
        else {
            return equation.calculate(t1, vars, min, max, k);
        }
    }

    public dynamicViscosity(t: number = this.t): number {
        const viscosityValue = this.fluid.viscosity.values[this.fluid.viscosity.def];
        const {min, max, vars, k} = viscosityValue;
        if(t<=max && t>=min) {
            const equation = Common.equation(viscosityValue.type);
            return equation.calculate(t, vars, min, max, k);
        }
        else{
            return this.chapmanEnskogEquation(t);
        }
    }

    // ref 7, 9-4
    public chapmanEnskogEquation(t: number): number {
        const collisionIntegral = this.collisionIntegral(t);
        return 2.669e-6*Math.pow(1000*this.fluid.Mr*t, 0.5)/(Math.pow(this.fluid.collisionDiameter, 2)*collisionIntegral);
    }
    //ref 7, 9-5
    public collisionIntegral(t): number {
        const t1 = t/this.fluid.epsilonToKb;
        return  1.16145*Math.pow(t1,-0.14874) + 0.52487*Math.exp(-0.7732*t1)+2.16178*Math.exp(-2.43783*t1);
    }
    public thermalDiffusivity(): number {
        return this.thermalConductivity()/(this.density()*this.heatCapacity());
    }

    public density(): number {
        return  this.p*this.fluid.Mr/(Common.R*this.t);

    }

    public prandtlNumber(): number {
        return this.heatCapacity() * this.dynamicViscosity() / this.thermalConductivity();
    }
}