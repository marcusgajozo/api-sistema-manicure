import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1782316320645 implements MigrationInterface {
  name = 'InitialSchema1782316320645';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "procedures" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP, "deleted_at" TIMESTAMP, "name" text, "description" text, "price" integer NOT NULL DEFAULT '0', "return_days" integer NOT NULL DEFAULT '0', "duration_minutes" integer NOT NULL DEFAULT '0', "user_id" uuid NOT NULL, CONSTRAINT "PK_e7775bab78f27b4c47580b6cb4b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."schedule_templates_day_of_week_enum" AS ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')`,
    );
    await queryRunner.query(
      `CREATE TABLE "schedule_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP, "deleted_at" TIMESTAMP, "day_of_week" "public"."schedule_templates_day_of_week_enum" NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "user_id" uuid NOT NULL, CONSTRAINT "PK_e29cc34d3450b4781c1aa72d8f8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "time_offs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP, "deleted_at" TIMESTAMP, "start_date" TIMESTAMP NOT NULL, "end_date" TIMESTAMP NOT NULL, "reason" character varying(255), "user_id" uuid NOT NULL, CONSTRAINT "PK_96e32bf316077ae91d3cec38bfc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP, "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "phone" character varying NOT NULL, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP, "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "phone" character varying NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."appointments_notify_client_enum" AS ENUM('not_notify', 'notified', 'pending_notification')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."appointments_status_appointment_enum" AS ENUM('pending_status', 'scheduled', 'canceled', 'done')`,
    );
    await queryRunner.query(
      `CREATE TABLE "appointments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP, "deleted_at" TIMESTAMP, "procedure_name" character varying, "procedure_price" integer, "procedure_follow_up_days" integer, "client_name" character varying, "phone_client" character varying, "start_date" TIMESTAMP NOT NULL, "end_date" TIMESTAMP NOT NULL, "notify_client" "public"."appointments_notify_client_enum" NOT NULL DEFAULT 'pending_notification', "status_appointment" "public"."appointments_status_appointment_enum" NOT NULL DEFAULT 'scheduled', "client_id" uuid, "procedure_id" uuid, "user_id" uuid, CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "authentications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP, "deleted_at" TIMESTAMP, "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "UQ_e326319d7d4e8cdc3b382288533" UNIQUE ("email"), CONSTRAINT "REL_e9a778e982665303f152c01573" UNIQUE ("user_id"), CONSTRAINT "PK_2505c0cb39a2248520f306c1447" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedures" ADD CONSTRAINT "FK_6a70d45565b08f2da6273ffbab8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedule_templates" ADD CONSTRAINT "FK_7244f5df7ff813e73e6ed8e1bf1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_offs" ADD CONSTRAINT "FK_ebf220f1d0a636f726c50f4713a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "FK_07a7a09b04e7b035c9d90cf4984" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_ccc5bbce58ad6bc96faa428b1e4" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_11c8ca0bae60d10a21d2e8bbd69" FOREIGN KEY ("procedure_id") REFERENCES "procedures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_66dee3bea82328659a4db8e54b7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "authentications" ADD CONSTRAINT "FK_e9a778e982665303f152c01573d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "authentications" DROP CONSTRAINT "FK_e9a778e982665303f152c01573d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_66dee3bea82328659a4db8e54b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_11c8ca0bae60d10a21d2e8bbd69"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_ccc5bbce58ad6bc96faa428b1e4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "FK_07a7a09b04e7b035c9d90cf4984"`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_offs" DROP CONSTRAINT "FK_ebf220f1d0a636f726c50f4713a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedule_templates" DROP CONSTRAINT "FK_7244f5df7ff813e73e6ed8e1bf1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "procedures" DROP CONSTRAINT "FK_6a70d45565b08f2da6273ffbab8"`,
    );
    await queryRunner.query(`DROP TABLE "authentications"`);
    await queryRunner.query(`DROP TABLE "appointments"`);
    await queryRunner.query(
      `DROP TYPE "public"."appointments_status_appointment_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."appointments_notify_client_enum"`,
    );
    await queryRunner.query(`DROP TABLE "clients"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "time_offs"`);
    await queryRunner.query(`DROP TABLE "schedule_templates"`);
    await queryRunner.query(
      `DROP TYPE "public"."schedule_templates_day_of_week_enum"`,
    );
    await queryRunner.query(`DROP TABLE "procedures"`);
  }
}
