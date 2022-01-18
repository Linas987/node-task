import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity({ name:"Days"})
export class Days {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({length: 255})
    countryCode: string;
    @Column()
    date: string;
    @Column({length: 255, 
        nullable: true})
    name: string;
    @Column({length: 255})
    Type: string;
    @Column()
    dayOfWeek: number;
}