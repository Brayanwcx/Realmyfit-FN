import { MigrationInterface, QueryRunner } from "typeorm";

export class Realmyfit1773943524899 implements MigrationInterface {
    name = 'Realmyfit1773943524899'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "modules" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, CONSTRAINT "UQ_8cd1abde4b70e59644c98668c06" UNIQUE ("name"), CONSTRAINT "PK_7dbefd488bd96c5bf31f0ce0c95" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" character varying(255) NOT NULL, CONSTRAINT "UQ_ae4578dcaed5adff96595e61660" UNIQUE ("name"), CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "events" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "description" text, "date" date NOT NULL, "time" character varying(10), "location" character varying(255), "capacity" integer NOT NULL DEFAULT '0', "imageUrl" character varying(500), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."event_registrations_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "event_registrations" ("id" SERIAL NOT NULL, "registrationDate" TIMESTAMP NOT NULL DEFAULT now(), "status" "public"."event_registrations_status_enum" NOT NULL DEFAULT 'PENDING', "user_id" integer NOT NULL, "event_id" integer NOT NULL, CONSTRAINT "PK_953d3b862c2487289a92b2356e9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "memberships" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" text, "price" numeric(10,2) NOT NULL, "durationDays" integer NOT NULL, "benefits" text, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_25d28bd932097a9e90495ede7b4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_memberships_status_enum" AS ENUM('ACTIVE', 'EXPIRED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "user_memberships" ("id" SERIAL NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "status" "public"."user_memberships_status_enum" NOT NULL DEFAULT 'ACTIVE', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, "membership_id" integer NOT NULL, CONSTRAINT "PK_5da67bb31a58da5c021ed713860" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reviews" ("id" SERIAL NOT NULL, "rating" integer NOT NULL, "comment" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payments_paymentmethod_enum" AS ENUM('CASH', 'CARD', 'TRANSFER')`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" SERIAL NOT NULL, "amount" numeric(10,2) NOT NULL, "paymentMethod" "public"."payments_paymentmethod_enum" NOT NULL DEFAULT 'CASH', "status" "public"."payments_status_enum" NOT NULL DEFAULT 'PENDING', "reference" character varying(255), "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" text, "price" numeric(10,2) NOT NULL, "stock" integer NOT NULL DEFAULT '0', "imageUrl" character varying(500), "category" character varying(100), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" SERIAL NOT NULL, "quantity" integer NOT NULL, "unitPrice" numeric(10,2) NOT NULL, "subtotal" numeric(10,2) NOT NULL, "order_id" integer NOT NULL, "product_id" integer NOT NULL, CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" SERIAL NOT NULL, "totalAmount" numeric(10,2) NOT NULL DEFAULT '0', "status" "public"."orders_status_enum" NOT NULL DEFAULT 'PENDING', "shippingAddress" character varying(500), "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "lastName" character varying(255) NOT NULL, "docType" character varying(255) NOT NULL, "docNumber" character varying(255) NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "trainers" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "lastName" character varying(255) NOT NULL, "email" character varying(255), "phone" character varying(20), "specialty" character varying(255), "experience" character varying(255), "imageUrl" character varying(500), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_198da56395c269936d351ab774b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."machines_status_enum" AS ENUM('AVAILABLE', 'IN_MAINTENANCE', 'OUT_OF_SERVICE')`);
        await queryRunner.query(`CREATE TABLE "machines" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" text, "brand" character varying(255), "status" "public"."machines_status_enum" NOT NULL DEFAULT 'AVAILABLE', "imageUrl" character varying(500), "acquisitionDate" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7b0817c674bb984650c5274e713" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "contacts" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(20), "subject" character varying(255) NOT NULL, "message" text NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role_modules" ("role_id" integer NOT NULL, "module_id" integer NOT NULL, CONSTRAINT "PK_0898417a9cc2d78e322076dc86a" PRIMARY KEY ("role_id", "module_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d94c957204d1c78e702a97cc1a" ON "role_modules" ("role_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_037d3081ebb1e33fa2b4204e05" ON "role_modules" ("module_id") `);
        await queryRunner.query(`CREATE TABLE "user_roles" ("userId" integer NOT NULL, "roleId" integer NOT NULL, CONSTRAINT "PK_88481b0c4ed9ada47e9fdd67475" PRIMARY KEY ("userId", "roleId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_472b25323af01488f1f66a06b6" ON "user_roles" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_86033897c009fcca8b6505d6be" ON "user_roles" ("roleId") `);
        await queryRunner.query(`ALTER TABLE "event_registrations" ADD CONSTRAINT "FK_e42ba7c85b05c49c8de4f360543" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_registrations" ADD CONSTRAINT "FK_28b0a253c87a80a4b013c437f7d" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_memberships" ADD CONSTRAINT "FK_b369bfb0586d848e7f52f47d492" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_memberships" ADD CONSTRAINT "FK_12bfa040225db30fd3530569b5c" FOREIGN KEY ("membership_id") REFERENCES "memberships"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_427785468fb7d2733f59e7d7d39" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_modules" ADD CONSTRAINT "FK_d94c957204d1c78e702a97cc1a9" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_modules" ADD CONSTRAINT "FK_037d3081ebb1e33fa2b4204e057" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_472b25323af01488f1f66a06b67" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_86033897c009fcca8b6505d6be2" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_86033897c009fcca8b6505d6be2"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_472b25323af01488f1f66a06b67"`);
        await queryRunner.query(`ALTER TABLE "role_modules" DROP CONSTRAINT "FK_037d3081ebb1e33fa2b4204e057"`);
        await queryRunner.query(`ALTER TABLE "role_modules" DROP CONSTRAINT "FK_d94c957204d1c78e702a97cc1a9"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_427785468fb7d2733f59e7d7d39"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf"`);
        await queryRunner.query(`ALTER TABLE "user_memberships" DROP CONSTRAINT "FK_12bfa040225db30fd3530569b5c"`);
        await queryRunner.query(`ALTER TABLE "user_memberships" DROP CONSTRAINT "FK_b369bfb0586d848e7f52f47d492"`);
        await queryRunner.query(`ALTER TABLE "event_registrations" DROP CONSTRAINT "FK_28b0a253c87a80a4b013c437f7d"`);
        await queryRunner.query(`ALTER TABLE "event_registrations" DROP CONSTRAINT "FK_e42ba7c85b05c49c8de4f360543"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_86033897c009fcca8b6505d6be"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_472b25323af01488f1f66a06b6"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_037d3081ebb1e33fa2b4204e05"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d94c957204d1c78e702a97cc1a"`);
        await queryRunner.query(`DROP TABLE "role_modules"`);
        await queryRunner.query(`DROP TABLE "contacts"`);
        await queryRunner.query(`DROP TABLE "machines"`);
        await queryRunner.query(`DROP TYPE "public"."machines_status_enum"`);
        await queryRunner.query(`DROP TABLE "trainers"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_paymentmethod_enum"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP TABLE "user_memberships"`);
        await queryRunner.query(`DROP TYPE "public"."user_memberships_status_enum"`);
        await queryRunner.query(`DROP TABLE "memberships"`);
        await queryRunner.query(`DROP TABLE "event_registrations"`);
        await queryRunner.query(`DROP TYPE "public"."event_registrations_status_enum"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP TABLE "role"`);
        await queryRunner.query(`DROP TABLE "modules"`);
    }

}

