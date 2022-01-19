import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `<h2>Wellcome</h2>
    type /api for documentation`;
  }
}
