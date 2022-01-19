import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HolidaysController } from './holidays.controller';
import { HolidaysService } from './holiday.service';
import { Days } from './day.entity';
import { Countries } from './countries.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Days, Countries])],
  controllers: [HolidaysController],
  providers: [HolidaysService],
})
export class HolidaysModule {}
