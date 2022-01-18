import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductsController } from "./holidays.controller";
import { ProductsService } from "./holiday.service";
import { Days } from "./day.entity";
import { Countries } from "./countries.entity";

@Module({
    imports:[
        TypeOrmModule.forFeature([Days,Countries])
    ],
    controllers: [ProductsController],
    providers: [ProductsService]
})

export class ProductsModule{}