import { Type } from 'class-transformer';
import { IsOptional, IsNumber, IsString, Min } from 'class-validator';

export class SearchListingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  prix_min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  prix_max?: number;

  @IsOptional()
  @IsString()
  type_logement?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  nb_chambres_min?: number;

  // Distance maximale par rapport à l'UQAC, en kilomètres
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distance_km?: number;
}
