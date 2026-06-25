import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('settings')
export class Setting {
    @PrimaryColumn()
    id: number;

    @Column({ nullable: true })
    contactEmail: string;

    @Column({ nullable: true })
    whatsappNumber: string;

    @Column({ nullable: true })
    locationAddress: string;

    @Column({ nullable: true })
    googleMapsUrl: string;
}
