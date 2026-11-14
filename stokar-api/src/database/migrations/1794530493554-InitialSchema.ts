import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1794530493554 implements MigrationInterface {
    name = 'InitialSchema1794530493554'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(100) NOT NULL, "description" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'MANAGER', 'OPERATOR', 'REQUESTER')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(120) NOT NULL, "email" character varying(180) NOT NULL, "password_hash" character varying(100) NOT NULL, "role" "public"."user_role" NOT NULL DEFAULT 'REQUESTER', "active" boolean NOT NULL DEFAULT true, "email_notifications" boolean NOT NULL DEFAULT true, "token_version" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "type" character varying(40) NOT NULL, "title" character varying(160) NOT NULL, "message" text NOT NULL, "data" jsonb, "read_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5323ccd23482802bd9759e88ee" ON "notifications"  ("user_id", "read_at") `);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "sku" character varying(60) NOT NULL, "name" character varying(160) NOT NULL, "description" text, "unit" character varying(10) NOT NULL DEFAULT 'UN', "quantity" numeric(14,3) NOT NULL DEFAULT '0', "min_quantity" numeric(14,3) NOT NULL DEFAULT '0', "cost_price" numeric(14,4) NOT NULL DEFAULT '0', "location" character varying(80), "active" boolean NOT NULL DEFAULT true, "category_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_c44ac33a05b144dd0d9ddcf9327" UNIQUE ("sku"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "service_request_items" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "service_request_id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity" numeric(14,3) NOT NULL, CONSTRAINT "UQ_c1c6c2dcd0c080d71c5975bac7b" UNIQUE ("service_request_id", "product_id"), CONSTRAINT "PK_cd304aaa176d1b549e61ee26122" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."request_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT')`);
        await queryRunner.query(`CREATE TYPE "public"."request_status" AS ENUM('OPEN', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "service_requests" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "number" SERIAL NOT NULL, "title" character varying(160) NOT NULL, "description" text NOT NULL, "priority" "public"."request_priority" NOT NULL DEFAULT 'MEDIUM', "status" "public"."request_status" NOT NULL DEFAULT 'OPEN', "status_reason" text, "resolution_notes" text, "due_date" date, "requester_id" uuid NOT NULL, "assignee_id" uuid, "approved_at" TIMESTAMP WITH TIME ZONE, "started_at" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_48ec7a23ecaceef170f76290d6b" UNIQUE ("number"), CONSTRAINT "PK_ee60bcd826b7e130bfbd97daf66" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_80d4e9cce72ad92b06085b69b5" ON "service_requests"  ("status") `);
        await queryRunner.query(`CREATE TABLE "suppliers" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(160) NOT NULL, "document" character varying(20), "email" character varying(180), "phone" character varying(30), "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_473e5a4285b43f7ae5968a4e4f3" UNIQUE ("document"), CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."movement_type" AS ENUM('IN', 'OUT', 'ADJUSTMENT')`);
        await queryRunner.query(`CREATE TABLE "stock_movements" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "type" "public"."movement_type" NOT NULL, "quantity" numeric(14,3) NOT NULL, "balance_before" numeric(14,3) NOT NULL, "balance_after" numeric(14,3) NOT NULL, "unit_cost" numeric(14,4), "reason" character varying(255), "document" character varying(60), "product_id" uuid NOT NULL, "supplier_id" uuid, "service_request_id" uuid, "user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_57a26b190618550d8e65fb860e7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0629673167b53d183512499abf" ON "stock_movements"  ("product_id", "created_at") `);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_request_items" ADD CONSTRAINT "FK_f9d8e4800a7af88ab9146b8b590" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_request_items" ADD CONSTRAINT "FK_1d4ec5eb51e297f7ba58c120299" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD CONSTRAINT "FK_cd172d0e17e8aa32aa6ecff03c4" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD CONSTRAINT "FK_c6f57921f7a022a352fcb53dac8" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_2c1bb05b80ddcc562cd28d826c6" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_ba50f4ec0ca8df8e44d805c6533" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_b67759ad1d4df7a4bb5911638ee" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_d7fedfd6ee0f4a06648c48631c6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_d7fedfd6ee0f4a06648c48631c6"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_b67759ad1d4df7a4bb5911638ee"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_ba50f4ec0ca8df8e44d805c6533"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_2c1bb05b80ddcc562cd28d826c6"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP CONSTRAINT "FK_c6f57921f7a022a352fcb53dac8"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP CONSTRAINT "FK_cd172d0e17e8aa32aa6ecff03c4"`);
        await queryRunner.query(`ALTER TABLE "service_request_items" DROP CONSTRAINT "FK_1d4ec5eb51e297f7ba58c120299"`);
        await queryRunner.query(`ALTER TABLE "service_request_items" DROP CONSTRAINT "FK_f9d8e4800a7af88ab9146b8b590"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0629673167b53d183512499abf"`);
        await queryRunner.query(`DROP TABLE "stock_movements"`);
        await queryRunner.query(`DROP TYPE "public"."movement_type"`);
        await queryRunner.query(`DROP TABLE "suppliers"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_80d4e9cce72ad92b06085b69b5"`);
        await queryRunner.query(`DROP TABLE "service_requests"`);
        await queryRunner.query(`DROP TYPE "public"."request_status"`);
        await queryRunner.query(`DROP TYPE "public"."request_priority"`);
        await queryRunner.query(`DROP TABLE "service_request_items"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5323ccd23482802bd9759e88ee"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."user_role"`);
        await queryRunner.query(`DROP TABLE "categories"`);
    }

}
