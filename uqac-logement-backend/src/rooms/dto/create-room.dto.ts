import { IsString, IsNumber, Min } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  nom: string;

  @IsNumber()
  @Min(0)
  prix: number;
}
