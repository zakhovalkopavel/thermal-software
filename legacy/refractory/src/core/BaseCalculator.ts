/**
 * Abstract base class for all calculators
 * Implements Template Method pattern
 */

import { Diagnostics } from '../types';

export abstract class BaseCalculator {
  protected diagnostics: Diagnostics;

  constructor() {
    this.diagnostics = this.initializeDiagnostics();
  }

  /**
   * Initialize diagnostics structure
   */
  protected initializeDiagnostics(): Diagnostics {
    return {
      massBalanceError: 0,
      warnings: [],
      assumptions: []
    };
  }

  /**
   * Reset diagnostics before new calculation
   */
  protected resetDiagnostics(): void {
    this.diagnostics = this.initializeDiagnostics();
  }

  /**
   * Add warning to diagnostics
   */
  protected addWarning(message: string): void {
    this.diagnostics.warnings.push(message);
  }

  /**
   * Add assumption to diagnostics
   */
  protected addAssumption(message: string): void {
    this.diagnostics.assumptions.push(message);
  }

  /**
   * Get current diagnostics
   */
  public getDiagnostics(): Diagnostics {
    return { ...this.diagnostics };
  }

  /**
   * Validate input data
   * Template method to be implemented by subclasses
   */
  protected abstract validateInput(...args: any[]): void;

  /**
   * Perform calculation
   * Template method to be implemented by subclasses
   */
  protected abstract calculate(...args: any[]): any;
}

