import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Days } from './holidays/day.entity';
import { Countries } from './holidays/countries.entity';
export const Connection: TypeOrmModuleOptions = {
  url: process.env.DATABASE_URL,
  type: 'postgres',
  ssl: {
    rejectUnauthorized: false,
  },
  host: 'ec2-52-19-164-214.eu-west-1.compute.amazonaws.com',
  port: 5432,
  username: 'lilglmeacijzvj',
  password: '6848c37c43f55cdb91e58775c3fa0889afafa2bc3a29cab4f6f925a15305b21e',
  database: 'd6ruibk54lskah',
  entities: [Days, Countries],
  synchronize: true,
};
