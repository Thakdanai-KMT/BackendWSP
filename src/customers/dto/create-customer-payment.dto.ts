import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCustomerPaymentDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(10000000)
  amount: number;

  @IsIn(['CASH', 'TRANSFER', 'CARD'])
  method: 'CASH' | 'TRANSFER' | 'CARD';

  // ไม่ส่ง = ใช้เวลาปัจจุบัน
  @IsOptional()
  @IsISO8601()
  paid_at?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  // ส่ง true เมื่อผู้ใช้ยืนยันแล้วว่ารับเกินยอดค้าง
  @IsOptional()
  @IsBoolean()
  confirm_overpay?: boolean;
}