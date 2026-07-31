import {
  IsEmail,
  IsDateString,
  IsNumber,
  IsInt,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CreateTenancyDto {
  // Le propriétaire identifie le locataire par email (il ne connaît pas
  // son id) — ce compte doit déjà exister (créé via /auth/register).
  @IsEmail()
  tenantEmail: string;

  @IsDateString()
  dateDebut: string;

  @IsNumber()
  @Min(0)
  loyerMensuel: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  jourEcheance?: number;
}
