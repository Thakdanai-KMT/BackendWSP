import { forwardRef, Module } from '@nestjs/common';
import { EmailService } from './email.service.js';
import { ReportsModule } from '../reports/reports.module.js';

@Module({
  imports: [forwardRef(() => ReportsModule)],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}