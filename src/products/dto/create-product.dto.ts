import { IsBoolean, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  product_name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unit_price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock_quantity?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}