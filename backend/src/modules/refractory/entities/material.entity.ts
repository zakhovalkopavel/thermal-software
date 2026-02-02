import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  type: string; // 'aggregate', 'cement', 'additive', 'binder'

  @Column({ nullable: true })
  description: string;

  @Column('jsonb')
  composition: {
    SiO2?: number;
    Al2O3?: number;
    CaO?: number;
    MgO?: number;
    Fe2O3?: number;
    K2O?: number;
    Na2O?: number;
    TiO2?: number;
    [key: string]: number | undefined;
  };

  @Column('float')
  rho_true_after_firing_kgm3: number;

  @Column('jsonb', { nullable: true })
  particleSize?: {
    d10_mm?: number;
    d50_mm?: number;
    d90_mm?: number;
    dMin_mm?: number;
    dMax_mm?: number;
  };

  @Column('jsonb', { nullable: true })
  thermalProperties?: {
    thermalConductivity_WmK?: number;
    specificHeat_JkgK?: number;
    thermalExpansion_perK?: number;
  };

  @Column('jsonb', { nullable: true })
  mechanicalProperties?: {
    crushingStrength_MPa?: number;
    modulusOfRupture_MPa?: number;
    youngModulus_GPa?: number;
  };

  @Column({ nullable: true })
  supplier: string;

  @Column({ nullable: true })
  grade: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

