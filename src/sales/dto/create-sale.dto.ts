import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsUUID,
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
  @IsIn(['CASH', 'TRANSFER', 'CARD'])
  payment_method: 'CASH' | 'TRANSFER' | 'CARD';

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemInput)
  items: SaleItemInput[];
}