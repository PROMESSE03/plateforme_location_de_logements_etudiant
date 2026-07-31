import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Menu de suivi des paiements : pour une annonce et un mois donnés,
  // le statut de chaque chambre (payé / en attente / en retard).
  // Exemple: GET /listings/:id/payments/summary?mois=2026-08-01
  @Get('listings/:listingId/payments/summary')
  summary(
    @Param('listingId') listingId: string,
    @Query('mois') mois: string,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.findSummaryForListing(listingId, mois, user);
  }

  @Get('tenancies/:tenancyId/payments')
  findByTenancy(
    @Param('tenancyId') tenancyId: string,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.findByTenancy(tenancyId, user);
  }

  @Patch('payments/:id/pay')
  markPaid(
    @Param('id') id: string,
    @Body() dto: MarkPaidDto,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.markPaid(id, dto, user);
  }

  // Déclenche manuellement la génération des paiements du mois courant
  // pour toutes les locations actives — utile en développement/démo
  // sans attendre le job planifié (tous les jours à 6h en production).
  @UseGuards(RolesGuard)
  @Roles(RoleType.ADMIN)
  @Post('admin/jobs/generate-monthly-payments')
  async runJob() {
    const count =
      await this.paymentsService.generateCurrentMonthForAllActiveTenancies();
    return { locationsTraitees: count };
  }
}
