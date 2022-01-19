import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HolidaysModule } from './holidays/holidays.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from './app.database';

@Module({
  imports: [HolidaysModule, TypeOrmModule.forRoot(Connection)],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
