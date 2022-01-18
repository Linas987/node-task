import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/holidays.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from './app.database';

@Module({
  imports: [ProductsModule,
    TypeOrmModule.forRoot(Connection),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
