import { Module } from '@nestjs/common';
import { PracticeController } from './practice.controller';

@Module({
  controllers: [PracticeController],
})
export class PracticeModule {}
