import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventPrice1774000000000 implements MigrationInterface {
    name = 'AddEventPrice1774000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "events" ADD "price" numeric(10,2) NOT NULL DEFAULT 0`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "price"`);
    }
}
