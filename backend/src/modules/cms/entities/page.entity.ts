import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PageKind } from '../enums/page-kind.enum';

@Entity('page')
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 512, unique: true })
  path: string;

  @Column({ type: 'varchar', length: 32 })
  kind: PageKind;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', default: '' })
  resume: string;

  @Column({ type: 'text', nullable: true })
  bodyHtml: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  seoTitle: string | null;

  @Column({ type: 'text', nullable: true })
  seoDescription: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  seoKeywords: string | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  ogImageUrl: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  canonicalPath: string | null;

  @Column({ type: 'boolean', default: true })
  published: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
