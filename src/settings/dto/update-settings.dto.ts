import { IsInt, IsObject, IsOptional, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  low_stock_threshold?: number;

  @Min(0)
  @Max(100)
  @IsOptional()
  vat_rate?: number;

  @IsObject()
  @IsOptional()
  extra?: Record<string, unknown>;
}