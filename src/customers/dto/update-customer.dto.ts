import { PartialType } from '@nestjs/mapped-types';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { CreateCustomerDto } from './create-customer.dto.js';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  // วงเงินเครดิต: ส่ง null เพื่อยกเลิกวงเงิน (ไม่จำกัด)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10000000)
  credit_limit?: number | null;
}