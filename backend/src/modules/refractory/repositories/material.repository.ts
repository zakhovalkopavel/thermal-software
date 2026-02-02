import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from '../entities/material.entity';

@Injectable()
export class MaterialRepository {
  constructor(
    @InjectRepository(Material)
    private readonly repository: Repository<Material>,
  ) {}

  async findAll(): Promise<Material[]> {
    return this.repository.find({ where: { isActive: true } });
  }

  async findById(id: string): Promise<Material | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<Material | null> {
    return this.repository.findOne({ where: { name } });
  }

  async findByType(type: string): Promise<Material[]> {
    return this.repository.find({ where: { type, isActive: true } });
  }

  async create(materialData: Partial<Material>): Promise<Material> {
    const material = this.repository.create(materialData);
    return this.repository.save(material);
  }

  async update(id: string, materialData: Partial<Material>): Promise<Material | null> {
    await this.repository.update(id, materialData);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.update(id, { isActive: false });
  }

  async search(query: string): Promise<Material[]> {
    return this.repository
      .createQueryBuilder('material')
      .where('material.name ILIKE :query', { query: `%${query}%` })
      .orWhere('material.description ILIKE :query', { query: `%${query}%` })
      .andWhere('material.isActive = :isActive', { isActive: true })
      .getMany();
  }
}

