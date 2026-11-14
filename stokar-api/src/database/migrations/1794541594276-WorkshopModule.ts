import { MigrationInterface, QueryRunner } from "typeorm";

export class WorkshopModule1794541594276 implements MigrationInterface {
    name = 'WorkshopModule1794541594276'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."customer_type" AS ENUM('PERSON', 'COMPANY')`);
        await queryRunner.query(`CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "type" "public"."customer_type" NOT NULL DEFAULT 'PERSON', "name" character varying(160) NOT NULL, "trade_name" character varying(160), "document" character varying(20), "email" character varying(180), "phone" character varying(30), "address" character varying(255), "notes" text, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_68c9c024a07c49ad6a2072d23c6" UNIQUE ("document"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "conversations" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "customer_id" uuid, "last_message_at" TIMESTAMP WITH TIME ZONE, "last_message_preview" character varying(200), "unread_by_staff" integer NOT NULL DEFAULT '0', "unread_by_client" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_3a9ae579e61e81cc0e989afeb4a" UNIQUE ("user_id"), CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9185e4a10f53167d15f23e1720" ON "conversations"  ("last_message_at") `);
        await queryRunner.query(`CREATE TABLE "chat_messages" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "conversation_id" uuid NOT NULL, "sender_id" uuid, "from_staff" boolean NOT NULL, "body" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_40c55ee0e571e268b0d3cd37d10" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bdfd8165e694fe9d3ce4140c87" ON "chat_messages"  ("conversation_id", "created_at") `);
        await queryRunner.query(`CREATE TABLE "company_settings" ("id" integer NOT NULL, "name" character varying(160) NOT NULL, "document" character varying(20), "email" character varying(180), "phone" character varying(30), "address" character varying(255), "invoice_footer" text, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_036b4634217db79c17305442dbe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "service_types" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(100) NOT NULL, "description" text, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_7dadebaed69653520aa93bbc84d" UNIQUE ("name"), CONSTRAINT "PK_1dc93417a097cdee3491f39d7cc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(160) NOT NULL, "description" text, "price" numeric(14,2) NOT NULL DEFAULT '0', "estimated_minutes" integer, "active" boolean NOT NULL DEFAULT true, "service_type_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "contract_services" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "contract_id" uuid NOT NULL, "service_id" uuid NOT NULL, "price" numeric(14,2) NOT NULL, CONSTRAINT "UQ_dfad6ff923a3880da73ae7274c2" UNIQUE ("contract_id", "service_id"), CONSTRAINT "PK_45f045ee7b47452e187cafbd37e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."contract_status" AS ENUM('ACTIVE', 'SUSPENDED', 'ENDED')`);
        await queryRunner.query(`CREATE TABLE "contracts" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "number" SERIAL NOT NULL, "title" character varying(160) NOT NULL, "description" text, "status" "public"."contract_status" NOT NULL DEFAULT 'ACTIVE', "start_date" date NOT NULL, "end_date" date, "monthly_value" numeric(14,2), "discount_percent" numeric(5,2) NOT NULL DEFAULT '0', "customer_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_7f9a578e633d6521bcc2d9cc8cb" UNIQUE ("number"), CONSTRAINT "PK_2c7b8f3a7b1acdd49497d83d0fb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2e66f7950711366031e3200413" ON "contracts"  ("customer_id") `);
        await queryRunner.query(`CREATE TABLE "service_request_services" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "service_request_id" uuid NOT NULL, "service_id" uuid, "description" character varying(200) NOT NULL, "quantity" numeric(10,2) NOT NULL DEFAULT '1', "unit_price" numeric(14,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_4c9ec74f2be629c254dcbf67784" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_58ad2c52174cbf3b58571a02d3" ON "service_request_services"  ("service_request_id") `);
        await queryRunner.query(`CREATE TABLE "vehicles" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "customer_id" uuid NOT NULL, "plate" character varying(20), "brand" character varying(60), "model" character varying(100) NOT NULL, "year" integer, "color" character varying(40), "notes" text, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_ec7181ebdab798d97070122a5bf" UNIQUE ("plate"), CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c1cda98f67cb9c79a1f1153e62" ON "vehicles"  ("customer_id") `);
        await queryRunner.query(`CREATE TYPE "public"."invoice_status" AS ENUM('ISSUED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "number" SERIAL NOT NULL, "status" "public"."invoice_status" NOT NULL DEFAULT 'ISSUED', "service_request_id" uuid NOT NULL, "customer_id" uuid, "issuer" jsonb NOT NULL, "recipient" jsonb, "reference" jsonb NOT NULL, "lines" jsonb NOT NULL, "services_total" numeric(14,2) NOT NULL, "parts_total" numeric(14,2) NOT NULL, "discount" numeric(14,2) NOT NULL DEFAULT '0', "total" numeric(14,2) NOT NULL, "notes" text, "issued_by_id" uuid, "issued_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "cancelled_at" TIMESTAMP WITH TIME ZONE, "cancel_reason" text, CONSTRAINT "UQ_6b20aa66f2a835a4f2fbde48724" UNIQUE ("number"), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4356a87f4b44a2cd84fe1fc067" ON "invoices"  ("service_request_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_65e3145f317bd655481d3f96c7" ON "invoices"  ("customer_id") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "phone" character varying(30)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "customer_id" uuid`);
        await queryRunner.query(`ALTER TABLE "products" ADD "sale_price" numeric(14,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "service_request_items" ADD "unit_price" numeric(14,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "customer_id" uuid`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "contract_id" uuid`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "vehicle_id" uuid`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "origin" character varying(10) NOT NULL DEFAULT 'WEB'`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "discount" numeric(14,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TYPE "public"."user_role" ADD VALUE 'CLIENT'`);
        await queryRunner.query(`CREATE INDEX "IDX_1f899159d1935fa7ff19f06d73" ON "service_requests"  ("customer_id") `);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_c7bc1ffb56c570f42053fa7503b" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_3a9ae579e61e81cc0e989afeb4a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_c9f0434c15cacf894e996f69088" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_3d623662d4ee1219b23cf61e649" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_9e5fc47ecb06d4d7b84633b1718" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "services" ADD CONSTRAINT "FK_70d400878cfc6cf1a8dcfcdcf66" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contract_services" ADD CONSTRAINT "FK_95fad3975dfa4ce4057e318bda0" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contract_services" ADD CONSTRAINT "FK_1b80c9746f23e6c053d81446972" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contracts" ADD CONSTRAINT "FK_2e66f7950711366031e3200413d" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_request_services" ADD CONSTRAINT "FK_58ad2c52174cbf3b58571a02d31" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_request_services" ADD CONSTRAINT "FK_778e74b95186cf439dee4533969" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_c1cda98f67cb9c79a1f1153e627" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD CONSTRAINT "FK_1f899159d1935fa7ff19f06d733" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD CONSTRAINT "FK_2d97ec6fc7cc9bb1f8e6738977a" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD CONSTRAINT "FK_ad48019ef26a838567dcfdcafee" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_4356a87f4b44a2cd84fe1fc0670" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_65e3145f317bd655481d3f96c74" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_c18ff1bf7ca6da2a2e3b8c61b44" FOREIGN KEY ("issued_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_c18ff1bf7ca6da2a2e3b8c61b44"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_65e3145f317bd655481d3f96c74"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_4356a87f4b44a2cd84fe1fc0670"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP CONSTRAINT "FK_ad48019ef26a838567dcfdcafee"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP CONSTRAINT "FK_2d97ec6fc7cc9bb1f8e6738977a"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP CONSTRAINT "FK_1f899159d1935fa7ff19f06d733"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_c1cda98f67cb9c79a1f1153e627"`);
        await queryRunner.query(`ALTER TABLE "service_request_services" DROP CONSTRAINT "FK_778e74b95186cf439dee4533969"`);
        await queryRunner.query(`ALTER TABLE "service_request_services" DROP CONSTRAINT "FK_58ad2c52174cbf3b58571a02d31"`);
        await queryRunner.query(`ALTER TABLE "contracts" DROP CONSTRAINT "FK_2e66f7950711366031e3200413d"`);
        await queryRunner.query(`ALTER TABLE "contract_services" DROP CONSTRAINT "FK_1b80c9746f23e6c053d81446972"`);
        await queryRunner.query(`ALTER TABLE "contract_services" DROP CONSTRAINT "FK_95fad3975dfa4ce4057e318bda0"`);
        await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_70d400878cfc6cf1a8dcfcdcf66"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_9e5fc47ecb06d4d7b84633b1718"`);
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_3d623662d4ee1219b23cf61e649"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_c9f0434c15cacf894e996f69088"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_3a9ae579e61e81cc0e989afeb4a"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_c7bc1ffb56c570f42053fa7503b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1f899159d1935fa7ff19f06d73"`);
        // Clientes do app não existem no esquema anterior: viram solicitantes inativos
        await queryRunner.query(`UPDATE "users" SET "role" = 'REQUESTER', "active" = false WHERE "role" = 'CLIENT'`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_old" AS ENUM('ADMIN', 'MANAGER', 'OPERATOR', 'REQUESTER')`);
        // O default precisa sair antes da troca de tipo (o Postgres não converte o default sozinho)
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."user_role_old" USING "role"::"text"::"public"."user_role_old"`);
        await queryRunner.query(`DROP TYPE "public"."user_role"`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_old" RENAME TO "user_role"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'REQUESTER'`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "discount"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "origin"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "vehicle_id"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "contract_id"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "customer_id"`);
        await queryRunner.query(`ALTER TABLE "service_request_items" DROP COLUMN "unit_price"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "sale_price"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "customer_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_65e3145f317bd655481d3f96c7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4356a87f4b44a2cd84fe1fc067"`);
        await queryRunner.query(`DROP TABLE "invoices"`);
        await queryRunner.query(`DROP TYPE "public"."invoice_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c1cda98f67cb9c79a1f1153e62"`);
        await queryRunner.query(`DROP TABLE "vehicles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_58ad2c52174cbf3b58571a02d3"`);
        await queryRunner.query(`DROP TABLE "service_request_services"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2e66f7950711366031e3200413"`);
        await queryRunner.query(`DROP TABLE "contracts"`);
        await queryRunner.query(`DROP TYPE "public"."contract_status"`);
        await queryRunner.query(`DROP TABLE "contract_services"`);
        await queryRunner.query(`DROP TABLE "services"`);
        await queryRunner.query(`DROP TABLE "service_types"`);
        await queryRunner.query(`DROP TABLE "company_settings"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bdfd8165e694fe9d3ce4140c87"`);
        await queryRunner.query(`DROP TABLE "chat_messages"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9185e4a10f53167d15f23e1720"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`DROP TYPE "public"."customer_type"`);
    }

}
