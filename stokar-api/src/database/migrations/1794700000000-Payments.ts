import { MigrationInterface, QueryRunner } from 'typeorm';

/** Pagamento das solicitações de serviço e dados de PIX da oficina. */
export class Payments1794700000000 implements MigrationInterface {
    name = 'Payments1794700000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "paid_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "payment_method" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "payment_notes" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "payment_confirmed_by_id" uuid`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD CONSTRAINT "FK_service_requests_payment_confirmed_by" FOREIGN KEY ("payment_confirmed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "IDX_service_requests_paid_at" ON "service_requests" ("paid_at")`);

        await queryRunner.query(`ALTER TABLE "company_settings" ADD "pix_key_type" character varying(10)`);
        await queryRunner.query(`ALTER TABLE "company_settings" ADD "pix_key" character varying(140)`);
        await queryRunner.query(`ALTER TABLE "company_settings" ADD "pix_city" character varying(60)`);
        await queryRunner.query(`ALTER TABLE "company_settings" ADD "payment_instructions" text`);
        await queryRunner.query(`ALTER TABLE "company_settings" ADD "require_payment_to_complete" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN "require_payment_to_complete"`);
        await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN "payment_instructions"`);
        await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN "pix_city"`);
        await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN "pix_key"`);
        await queryRunner.query(`ALTER TABLE "company_settings" DROP COLUMN "pix_key_type"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_service_requests_paid_at"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP CONSTRAINT "FK_service_requests_payment_confirmed_by"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "payment_confirmed_by_id"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "payment_notes"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "payment_method"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "paid_at"`);
    }
}
