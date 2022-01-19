import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { HolidaysService } from './holiday.service';

@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}
  @Get()
  getAllCountries() {
    return this.holidaysService.getAllCountries();
  }
  @Get('/:country/:year/:month')
  getMonthHolidays(
    @Param('country') country: string,
    @Param('year') year: number,
    @Param('month') month: number,
  ) {
    return this.holidaysService.getMonthHolidays(country, year, month);
  }
  @Get('/:country/:date')
  getDays(@Param('country') country: string, @Param('date') date: string) {
    return this.holidaysService.getDayStatus(country, date);
  }
}
