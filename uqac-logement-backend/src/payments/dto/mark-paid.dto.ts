import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { PaymentMethod } from '../../common/enums/payment-method.enum';

export class MarkPaidDto {
  @IsEnum(PaymentMethod)
  methode: PaymentMethod;

  // Si non fourni, la date du jour est utilisée
  @IsOptional()
  @IsDateString()
  datePaiement?: string;
}
