/**
 * Mix Library Service
 *
 * Manages custom mix presets with save/load/delete operations.
 * Provides persistence layer using LocalStorage and JSON export/import.
 *
 * This is a critical feature that allows users to:
 * - Save optimized blends as reusable presets
 * - Load saved mixes in any calculator (phase equilibrium, thermal performance)
 * - Export/import mix libraries for sharing
 * - Manage mix versions and categories
 *
 * @module MixLibraryService
 */

import { SavedMix, FractionInput, FinalProperties } from '../types/blend-types';
// OptimizationOptions type removed - not used in this service

export interface MixLibrary {
  version: string;
  lastUpdated: string;
  mixes: SavedMix[];
}

export interface MixFilter {
  tags?: string[];
  category?: string;
  search?: string;
  method?: 'Andreasen' | 'FunkDinger';
}

export class MixLibraryService {
  private static instance: MixLibraryService;
  private readonly STORAGE_KEY = 'refractory_mix_library';
  private readonly VERSION = '1.0.0';
  private library: MixLibrary;

  private constructor() {
    this.library = this.loadFromStorage();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MixLibraryService {
    if (!MixLibraryService.instance) {
      MixLibraryService.instance = new MixLibraryService();
    }
    return MixLibraryService.instance;
  }

  /**
   * Save a new mix to the library
   *
   * @param name Mix name
   * @param composition Fraction composition
   * @param properties Calculated properties
   * @param optimizationParams Parameters used for optimization
   * @param metadata Optional metadata (description, tags, category)
   * @returns Saved mix with generated ID
   */
  public saveMix(
    name: string,
    composition: FractionInput[],
    properties: FinalProperties,
    optimizationParams: {
      method: 'Andreasen' | 'FunkDinger';
      q: number;
      scenario: string;
      packingModel: 'CPM' | 'Furnas';
    },
    metadata?: {
      description?: string;
      tags?: string[];
      category?: string;
      author?: string;
    }
  ): SavedMix {
    const now = new Date().toISOString();

    // Generate unique ID
    const id = this.generateId();

    // Calculate oxide composition from fractions
    const oxideComposition = this.calculateOxideComposition(composition);

    const savedMix: SavedMix = {
      id,
      name,
      description: metadata?.description,
      createdDate: now,
      modifiedDate: now,
      author: metadata?.author,
      composition,
      optimizationParams,
      properties,
      tags: metadata?.tags || [],
      category: metadata?.category,
      version: 1,
      oxideComposition
    };

    // Add to library
    this.library.mixes.push(savedMix);
    this.library.lastUpdated = now;

    // Persist to storage
    this.saveToStorage();

    return savedMix;
  }

  /**
   * Update an existing mix
   */
  public updateMix(id: string, updates: Partial<SavedMix>): SavedMix {
    const index = this.library.mixes.findIndex(m => m.id === id);
    if (index === -1) {
      throw new Error(`Mix not found: ${id}`);
    }

    const mix = this.library.mixes[index];
    const now = new Date().toISOString();

    // Update fields
    this.library.mixes[index] = {
      ...mix,
      ...updates,
      id: mix.id,  // Prevent ID change
      createdDate: mix.createdDate,  // Preserve creation date
      modifiedDate: now,
      version: (mix.version || 1) + 1  // Increment version
    };

    this.library.lastUpdated = now;
    this.saveToStorage();

    return this.library.mixes[index];
  }

  /**
   * Get a mix by ID
   */
  public getMix(id: string): SavedMix | undefined {
    return this.library.mixes.find(m => m.id === id);
  }

  /**
   * Get a mix by name
   */
  public getMixByName(name: string): SavedMix | undefined {
    return this.library.mixes.find(m => m.name === name);
  }

  /**
   * Get all mixes, optionally filtered
   */
  public getAllMixes(filter?: MixFilter): SavedMix[] {
    let mixes = [...this.library.mixes];

    if (!filter) {
      return mixes;
    }

    // Apply filters
    if (filter.category) {
      mixes = mixes.filter(m => m.category === filter.category);
    }

    if (filter.method) {
      mixes = mixes.filter(m => m.optimizationParams.method === filter.method);
    }

    if (filter.tags && filter.tags.length > 0) {
      mixes = mixes.filter(m =>
        m.tags?.some(tag => filter.tags!.includes(tag))
      );
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      mixes = mixes.filter(m =>
        m.name.toLowerCase().includes(searchLower) ||
        m.description?.toLowerCase().includes(searchLower)
      );
    }

    return mixes;
  }

  /**
   * Delete a mix by ID
   */
  public deleteMix(id: string): boolean {
    const initialLength = this.library.mixes.length;
    this.library.mixes = this.library.mixes.filter(m => m.id !== id);

    if (this.library.mixes.length < initialLength) {
      this.library.lastUpdated = new Date().toISOString();
      this.saveToStorage();
      return true;
    }

    return false;
  }

  /**
   * Duplicate a mix with a new name
   */
  public duplicateMix(id: string, newName: string): SavedMix {
    const original = this.getMix(id);
    if (!original) {
      throw new Error(`Mix not found: ${id}`);
    }

    const now = new Date().toISOString();
    const duplicated: SavedMix = {
      ...original,
      id: this.generateId(),
      name: newName,
      createdDate: now,
      modifiedDate: now,
      version: 1
    };

    this.library.mixes.push(duplicated);
    this.library.lastUpdated = now;
    this.saveToStorage();

    return duplicated;
  }

  /**
   * Get recently used mixes (by modification date)
   */
  public getRecentMixes(limit: number = 5): SavedMix[] {
    return [...this.library.mixes]
      .sort((a, b) => {
        const dateA = new Date(a.modifiedDate || a.createdDate);
        const dateB = new Date(b.modifiedDate || b.createdDate);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);
  }

  /**
   * Get all unique tags used in library
   */
  public getAllTags(): string[] {
    const tagSet = new Set<string>();
    for (const mix of this.library.mixes) {
      if (mix.tags) {
        mix.tags.forEach(tag => tagSet.add(tag));
      }
    }
    return Array.from(tagSet).sort();
  }

  /**
   * Get all unique categories used in library
   */
  public getAllCategories(): string[] {
    const categorySet = new Set<string>();
    for (const mix of this.library.mixes) {
      if (mix.category) {
        categorySet.add(mix.category);
      }
    }
    return Array.from(categorySet).sort();
  }

  /**
   * Export library or selected mixes to JSON
   */
  public exportToJSON(mixIds?: string[]): string {
    let mixesToExport: SavedMix[];

    if (mixIds && mixIds.length > 0) {
      mixesToExport = this.library.mixes.filter(m => mixIds.includes(m.id));
    } else {
      mixesToExport = this.library.mixes;
    }

    const exportData: MixLibrary = {
      version: this.VERSION,
      lastUpdated: new Date().toISOString(),
      mixes: mixesToExport
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import mixes from JSON
   *
   * @param jsonString JSON string containing mix library
   * @param mode 'merge' (default) or 'replace'
   * @returns Number of mixes imported
   */
  public importFromJSON(jsonString: string, mode: 'merge' | 'replace' = 'merge'): number {
    let importData: MixLibrary;

    try {
      importData = JSON.parse(jsonString);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }

    if (!importData.mixes || !Array.isArray(importData.mixes)) {
      throw new Error('Invalid mix library format');
    }

    if (mode === 'replace') {
      this.library.mixes = [];
    }

    let importedCount = 0;

    for (const mix of importData.mixes) {
      // Generate new ID to avoid conflicts
      const newMix: SavedMix = {
        ...mix,
        id: this.generateId(),
        modifiedDate: new Date().toISOString()
      };

      // Check for duplicate names
      const existing = this.getMixByName(newMix.name);
      if (existing) {
        newMix.name = `${newMix.name} (imported)`;
      }

      this.library.mixes.push(newMix);
      importedCount++;
    }

    this.library.lastUpdated = new Date().toISOString();
    this.saveToStorage();

    return importedCount;
  }

  /**
   * Clear all mixes from library
   */
  public clearLibrary(): void {
    this.library.mixes = [];
    this.library.lastUpdated = new Date().toISOString();
    this.saveToStorage();
  }

  /**
   * Get library statistics
   */
  public getStatistics(): {
    totalMixes: number;
    byCategory: { [category: string]: number };
    byMethod: { [method: string]: number };
    averageQValue: number;
  } {
    const stats = {
      totalMixes: this.library.mixes.length,
      byCategory: {} as { [category: string]: number },
      byMethod: {} as { [method: string]: number },
      averageQValue: 0
    };

    let totalQ = 0;

    for (const mix of this.library.mixes) {
      // Count by category
      const category = mix.category || 'Uncategorized';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

      // Count by method
      const method = mix.optimizationParams.method;
      stats.byMethod[method] = (stats.byMethod[method] || 0) + 1;

      // Sum q values
      totalQ += mix.optimizationParams.q;
    }

    stats.averageQValue = this.library.mixes.length > 0
      ? totalQ / this.library.mixes.length
      : 0;

    return stats;
  }

  /**
   * Calculate oxide composition from fraction composition
   * This enables seamless integration with phase equilibrium calculator
   */
  private calculateOxideComposition(_composition: FractionInput[]): {
    Al2O3?: number;
    SiO2?: number;
    CaO?: number;
    Fe2O3?: number;
    MgO?: number;
    [key: string]: number | undefined;
  } {
    // TODO: This should be calculated from actual material compositions
    // For now, return empty object - will be implemented with ComponentDictionary integration
    return {};
  }

  /**
   * Load library from LocalStorage
   */
  private loadFromStorage(): MixLibrary {
    if (typeof window === 'undefined' || !window.localStorage) {
      // Server-side or no storage available
      return this.createEmptyLibrary();
    }

    try {
      const stored = window.localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return this.createEmptyLibrary();
      }

      const library = JSON.parse(stored) as MixLibrary;

      // Validate structure
      if (!library.mixes || !Array.isArray(library.mixes)) {
        console.warn('Invalid library structure, creating new library');
        return this.createEmptyLibrary();
      }

      return library;
    } catch (error) {
      console.error('Error loading mix library:', error);
      return this.createEmptyLibrary();
    }
  }

  /**
   * Save library to LocalStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const json = JSON.stringify(this.library);
      window.localStorage.setItem(this.STORAGE_KEY, json);
    } catch (error) {
      console.error('Error saving mix library:', error);
      throw new Error('Failed to save mix library. Storage may be full.');
    }
  }

  /**
   * Create empty library structure
   */
  private createEmptyLibrary(): MixLibrary {
    return {
      version: this.VERSION,
      lastUpdated: new Date().toISOString(),
      mixes: []
    };
  }

  /**
   * Generate unique ID for mix
   */
  private generateId(): string {
    return `mix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

