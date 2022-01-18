import { Controller, Post, Body, Get, Param, Patch, Delete } from "@nestjs/common";
import { ProductsService } from "./holiday.service";

@Controller('holidays')
export class ProductsController{
    constructor(private readonly productsService: ProductsService){}
    @Get()
    getAllCountries(){
        return this.productsService.allCountries();
    }
    @Get('/:country/:year/:month')
    getMonthHolidays(@Param('country') country:string,@Param('year') year:number,@Param('month') month:number){
       return this.productsService.monthHolidays(country,year,month);
    }
    @Get('/:country/:date')
    getDays(@Param('country') country:string,@Param('date') date:string){
           return this.productsService.dayStatus(country,date);
    }

}