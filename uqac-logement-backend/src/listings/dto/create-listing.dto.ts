import {
  IsString,
  IsNumber,
  IsInt,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateListingDto {
  @IsString()
  titre: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  prix: number;

  @IsString()
  adresse: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  typeLogement: string;

  @IsInt()
  @Min(0)
  nbChambres: number;

  @IsOptional()
  @IsDateString()
  disponibleA?: string;
}
