import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('mix_presets')
export class MixPreset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('jsonb')
  fractions: Array<{
    materialId: string;
    materialName?: string;
    dMin_mm: number;
    dMax_mm: number;
    massFraction: number;
    isFixed?: boolean;
  }>;

  @Column('jsonb', { nullable: true })
  optimizationOptions?: {
    qValue?: number;
    method?: string;
    packingModel?: string;
    scenario?: string;
  };

  @Column('jsonb', { nullable: true })
  calculatedProperties?: {
    packingFraction?: number;
    bulkDensity_gml?: number;
    porosity_percent?: number;
    flowabilityCategory?: string;
  };

  @Column({ nullable: true })
  userId: string; // For user-specific presets

  @Column({ default: false })
  isPublic: boolean;

  @Column({ nullable: true })
  category: string; // 'castable', 'ramming', 'gunning', 'plastic'

  @Column({ default: 0 })
  usageCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

