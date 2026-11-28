import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CmsInitial1740000000000 implements MigrationInterface {
  name = 'CmsInitial1740000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_user" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "passwordHash" character varying(255) NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "site_setting" (
        "key" character varying(128) PRIMARY KEY,
        "value" text NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "page" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "path" character varying(512) NOT NULL,
        "kind" character varying(32) NOT NULL,
        "title" character varying(255) NOT NULL,
        "resume" text NOT NULL DEFAULT '',
        "bodyHtml" text,
        "seoTitle" character varying(255),
        "seoDescription" text,
        "seoKeywords" character varying(512),
        "ogImageUrl" character varying(1024),
        "canonicalPath" character varying(512),
        "published" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_page_path" UNIQUE ("path")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_page_kind" ON "page" ("kind")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_page_published" ON "page" ("published")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_page_published"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_page_kind"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "page"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "site_setting"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_user"`);
  }
}
