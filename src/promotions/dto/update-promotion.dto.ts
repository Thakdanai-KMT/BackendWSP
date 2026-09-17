import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePromotionDto {
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}