import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class SaleItemInput {
  @IsUUID()
  product_id: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateSaleDto {
  @IsIn(['CASH', 'TRANSFER', 'CARD', 'CREDIT'])
  payment_method: 'CASH' | 'TRANSFER' | 'CARD' | 'CREDIT';

  @IsUUID()
  @IsOptional()
  customer_id?: string;

  // ใช้เมื่อขายเชื่อเท่านั้น รูปแบบ YYYY-MM-DD
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'due_date must be YYYY-MM-DD' })
  due_date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  credit_note?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemInput)
  items: SaleItemInput[];
}