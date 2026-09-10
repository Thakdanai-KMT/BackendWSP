import { IsIn, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMovementDto {
  @IsUUID()
  product_id: string;

  @IsIn(['RECEIVE', 'ADJUSTMENT'])
  movement_type: 'RECEIVE' | 'ADJUSTMENT';

  @IsInt()
  quantity_change: number;

  @IsString()
  @IsOptional()
  reason?: string;
}