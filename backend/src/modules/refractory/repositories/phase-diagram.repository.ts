import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EutecticData } from '../entities/eutectic-data.entity';
import { EUTECTIC_SYSTEMS, getEutectic } from '../data/eutectic-systems.data';

@Injectable()
export class PhaseDiagramRepository {
  constructor(
    @InjectRepository(EutecticData)
    private readonly repository: Repository<EutecticData>,
  ) {}

  /**
   * Get eutectic from database or fallback to static data
   */
  async getEutectic(system: string, name: string): Promise<any> {
    // Try database first
    const dbEutectic = await this.repository.findOne({
      where: { system, name, isVerified: true },
    });

    if (dbEutectic) {
      return {
        name: dbEutectic.name,
        temperature: dbEutectic.temperature,
        composition: dbEutectic.composition,
        system: dbEutectic.system,
        references: dbEutectic.references,
      };
    }

    // Fallback to static data
    return getEutectic(system, name);
  }

  /**
   * Get all eutectics for a system
   */
  async getSystemEutectics(system: string): Promise<any[]> {
    const dbEutectics = await this.repository.find({
      where: { system, isVerified: true },
    });

    if (dbEutectics.length > 0) {
      return dbEutectics.map(e => ({
        name: e.name,
        temperature: e.temperature,
        composition: e.composition,
        system: e.system,
      }));
    }

    // Fallback to static data
    const staticData = EUTECTIC_SYSTEMS[system as keyof typeof EUTECTIC_SYSTEMS];
    if (!staticData) return [];

    return Object.values(staticData);
  }

  /**
   * Create new eutectic data entry
   */
  async create(eutecticData: Partial<EutecticData>): Promise<EutecticData> {
    const eutectic = this.repository.create(eutecticData);
    return this.repository.save(eutectic);
  }

  /**
   * List all available systems
   */
  async listSystems(): Promise<string[]> {
    const systems = await this.repository
      .createQueryBuilder('eutectic')
      .select('DISTINCT eutectic.system')
      .getRawMany();

    const dbSystems = systems.map(s => s.system);
    const staticSystems = Object.keys(EUTECTIC_SYSTEMS);

    return [...new Set([...dbSystems, ...staticSystems])];
  }
}

