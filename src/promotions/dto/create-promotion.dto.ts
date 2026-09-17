import { IsBoolean, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreatePromotionDto {
  @IsUUID()
  product_id: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sale_price: number;

  @IsBoolean()
  @IsOptional()
  confirm_below_cost?: boolean;
}