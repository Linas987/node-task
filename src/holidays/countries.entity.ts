import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'Countries' })
export class Countries {
  @PrimaryColumn({ length: 255 })
  countryCode: string;
  @Column({ length: 255 })
  countryFullname: string;
}
