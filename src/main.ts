import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const PORT = process.env.PORT || 3000;
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Node task')
    .setDescription(
      `The Node task API apart from the home (/) route it has other get requests, when using any of these get requests, the data if it doesnt exist in the database will be pulled from <a href="url">https://kayaposoft.com/enrico/</a> api and put into the postgresSQL database. code is hosted on Github <a href="url">https://github.com/Linas987/node-task</a>`,
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(PORT);
}
bootstrap();
