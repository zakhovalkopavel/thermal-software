import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('eutectic_data')
export class EutecticData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  system: string; // 'CAS', 'AS', 'MAS', etc.

  @Column('float')
  temperature: number; // °C

  @Column('jsonb')
  composition: {
    [oxide: string]: number; // wt%
  };

  @Column('text', { nullable: true })
  description: string;

  @Column('jsonb', { nullable: true })
  references: string[];

  @Column({ nullable: true })
  standard: string; // 'Levin1964', 'Nurse1965', etc.

  @Column('float', { nullable: true })
  uncertainty_C: number; // Temperature uncertainty

  @Column({ default: true })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

