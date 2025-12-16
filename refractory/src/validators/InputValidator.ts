/**
 * Input Validator
 * Strategy pattern for different validation strategies
 */

import { IComponent, OxideComposition, RefractoryConfig } from '../types';

export interface IValidator {
  validate(data: any): boolean;
  getErrors(): string[];
}

export class TemperatureValidator implements IValidator {
  private errors: string[] = [];

  constructor(private config: RefractoryConfig) {}

  public validate(temperature: number): boolean {
    this.errors = [];

    if (typeof temperature !== 'number' || isNaN(temperature)) {
      this.errors.push('Temperature must be a valid number');
      return false;
    }

    if (temperature < this.config.minTemperature) {
      this.errors.push(
        `Temperature ${temperature}°C is below minimum ${this.config.minTemperature}°C`
      );
      return false;
    }

    if (temperature > this.config.maxTemperature) {
      this.errors.push(
        `Temperature ${temperature}°C exceeds maximum ${this.config.maxTemperature}°C`
      );
      return false;
    }

    return true;
  }

  public getErrors(): string[] {
    return [...this.errors];
  }
}

export class CompositionValidator implements IValidator {
  private errors: string[] = [];

  constructor(private config: RefractoryConfig) {}

  public validate(composition: OxideComposition): boolean {
    this.errors = [];

    if (!composition || typeof composition !== 'object') {
      this.errors.push('Composition must be an object');
      return false;
    }

    const sum: number = Object.values(composition).reduce((acc: number, val) => acc + (val || 0), 0);

    if (sum > 0 && Math.abs(sum - 100) > this.config.tolerances.compositionSumTolerance) {
      this.errors.push(
        `Composition sum ${sum.toFixed(2)}% must equal 100% (±${this.config.tolerances.compositionSumTolerance}%)`
      );
      return false;
    }

    // Check for negative values
    for (const [oxide, value] of Object.entries(composition)) {
      if (value !== undefined && value < 0) {
        this.errors.push(`Oxide ${oxide} cannot have negative value: ${value}`);
        return false;
      }
    }

    return true;
  }

  public getErrors(): string[] {
    return [...this.errors];
  }
}

export class ComponentValidator implements IValidator {
  private errors: string[] = [];
  private compositionValidator: CompositionValidator;

  constructor(private config: RefractoryConfig) {
    this.compositionValidator = new CompositionValidator(config);
  }

  public validate(component: IComponent): boolean {
    this.errors = [];

    if (!component.name) {
      this.errors.push('Component must have a name');
      return false;
    }

    if (!component.composition) {
      this.errors.push(`Component '${component.name}' must have composition data`);
      return false;
    }

    if (!this.compositionValidator.validate(component.composition)) {
      this.errors.push(...this.compositionValidator.getErrors());
      return false;
    }

    if (!component.fractions || component.fractions.length === 0) {
      this.errors.push(`Component '${component.name}' must have particle size fractions`);
      return false;
    }

    // Validate fractions sum to 100%
    const fractionsSum = component.fractions.reduce((acc, f) => acc + f.amount, 0);
    if (Math.abs(fractionsSum - 100) > this.config.tolerances.compositionSumTolerance) {
      this.errors.push(
        `Fractions for '${component.name}' sum to ${fractionsSum.toFixed(2)}%, must equal 100%`
      );
      return false;
    }

    return true;
  }

  public getErrors(): string[] {
    return [...this.errors];
  }
}

export class InputValidator {
  private temperatureValidator: TemperatureValidator;
  private componentValidator: ComponentValidator;
  private warnings: string[] = [];

  constructor(private config: RefractoryConfig) {
    this.temperatureValidator = new TemperatureValidator(config);
    this.componentValidator = new ComponentValidator(config);
  }

  /**
   * Validate temperature and return validated value
   */
  public validateTemperature(temperature: number): number {
    this.warnings = [];

    if (!this.temperatureValidator.validate(temperature)) {
      throw new Error(this.temperatureValidator.getErrors().join('; '));
    }

    // Warn if near boundaries
    if (temperature < this.config.minTemperature + 50) {
      this.warnings.push(
        `Temperature ${temperature}°C is near minimum range; results may be less accurate`
      );
    }

    return temperature;
  }

  /**
   * Validate and normalize components
   */
  public validateComponents(components: IComponent[]): IComponent[] {
    if (!Array.isArray(components) || components.length === 0) {
      throw new Error('Components must be a non-empty array');
    }

    const validated: IComponent[] = [];

    for (const component of components) {
      if (!this.componentValidator.validate(component)) {
        throw new Error(
          `Component '${component.name}': ${this.componentValidator.getErrors().join('; ')}`
        );
      }
      validated.push(component);
    }

    // Normalize total amounts if provided
    const totalAmount = validated.reduce((acc, c) => acc + (c.amount || 0), 0);
    if (totalAmount > 0 && Math.abs(totalAmount - 100) > this.config.tolerances.compositionSumTolerance) {
      // Normalize to 100%
      validated.forEach(c => {
        if (c.amount) {
          c.amount = (c.amount / totalAmount) * 100;
        }
      });
      this.warnings.push('Component amounts normalized to 100%');
    }

    return validated;
  }

  /**
   * Get validation warnings
   */
  public getWarnings(): string[] {
    return [...this.warnings];
  }
}

