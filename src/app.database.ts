import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Days } from './products/day.entity'
import { Countries } from "./products/countries.entity";
export const Connection:TypeOrmModuleOptions ={
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'root',
    database: 'nestjs_task',
    entities: [Days,Countries],
    synchronize: true,
    
}