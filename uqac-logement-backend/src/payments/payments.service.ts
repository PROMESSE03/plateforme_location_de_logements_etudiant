import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Payment } from './entities/payment.entity';
import { Tenancy } from '../tenancies/entities/tenancy.entity';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { TenancyStatus } from '../common/enums/tenancy-status.enum';
import { User } from '../users/entities/user.entity';
import { RoomsService } from '../rooms/rooms.service';
import { ListingsService } from '../listings/listings.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepo: Repository<Payment>,
    @InjectRepository(Tenancy)
    private readonly tenanciesRepo: Repository<Tenancy>,
    private readonly roomsService: RoomsService,
    private readonly listingsService: ListingsService,
  ) {}

  // Date d'échéance du loyer pour un mois donné (ex: mois=2026-08-01,
  // jourEcheance=5 => échéance le 2026-08-05)
  private echeanceDate(mois: string, jourEcheance: number): Date {
    const d = new Date(mois);
    d.setDate(jourEcheance);
    return d;
  }

  private firstOfMonth(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
  }

  private canManageTenancy(tenancy: Tenancy, user: User): boolean {
    return (
      this.listingsService.isOwnerOf(tenancy.room.listing, user) ||
      this.listingsService.isAdmin(user)
    );
  }

  // Recalcule le statut si un paiement "en_attente" est maintenant en retard.
  // Appelé à la lecture pour que le statut soit toujours exact, même si le
  // job planifié n'est pas encore passé.
  private async refreshStatus(payment: Payment): Promise<Payment> {
    if (payment.statut !== PaymentStatus.EN_ATTENTE) {
      return payment;
    }
    const echeance = this.echeanceDate(
      payment.mois,
      payment.tenancy.jourEcheance,
    );
    if (new Date() > echeance) {
      payment.statut = PaymentStatus.EN_RETARD;
      return this.paymentsRepo.save(payment);
    }
    return payment;
  }

  // Crée la ligne de paiement du mois pour une location si elle n'existe
  // pas déjà (idempotent). Utilisé à la fois par le job planifié et par
  // l'endpoint de résumé mensuel (pour ne pas dépendre uniquement du cron
  // pendant le développement/les démos).
  async generateForTenancyAndMonth(
    tenancy: Tenancy,
    mois: string,
  ): Promise<Payment> {
    const existing = await this.paymentsRepo.findOne({
      where: { tenancy: { id: tenancy.id }, mois },
    });
    if (existing) {
      existing.tenancy = tenancy;
      return this.refreshStatus(existing);
    }

    const payment = this.paymentsRepo.create({
      tenancy,
      mois,
      montant: tenancy.loyerMensuel,
      statut: PaymentStatus.EN_ATTENTE,
    });
    const saved = await this.paymentsRepo.save(payment);
    saved.tenancy = tenancy;
    return this.refreshStatus(saved);
  }

  // Résumé mensuel par annonce : pour chaque chambre, le statut du
  // locataire actuel pour le mois demandé (payé / en attente / en retard).
  async findSummaryForListing(
    listingId: string,
    mois: string,
    user: User,
  ): Promise<
    Array<{
      room: { id: string; nom: string };
      tenant: { id: string; nom: string; email: string } | null;
      payment: Payment | null;
    }>
  > {
    const rooms = await this.roomsService.findByListing(listingId, user);

    const results: Array<{
      room: { id: string; nom: string };
      tenant: { id: string; nom: string; email: string } | null;
      payment: Payment | null;
    }> = [];
    for (const room of rooms) {
      const activeTenancy = await this.tenanciesRepo.findOne({
        where: { room: { id: room.id }, statut: TenancyStatus.ACTIVE },
      });

      if (!activeTenancy) {
        results.push({
          room: { id: room.id, nom: room.nom },
          tenant: null,
          payment: null,
        });
        continue;
      }

      const payment = await this.generateForTenancyAndMonth(
        activeTenancy,
        mois,
      );
      results.push({
        room: { id: room.id, nom: room.nom },
        tenant: {
          id: activeTenancy.tenant.id,
          nom: activeTenancy.tenant.nom,
          email: activeTenancy.tenant.email,
        },
        payment,
      });
    }
    return results;
  }

  async findByTenancy(tenancyId: string, user: User): Promise<Payment[]> {
    const tenancy = await this.tenanciesRepo.findOne({
      where: { id: tenancyId },
    });
    if (!tenancy) {
      throw new NotFoundException('Location introuvable');
    }
    const isTenant = tenancy.tenant.id === user.id;
    if (!isTenant && !this.canManageTenancy(tenancy, user)) {
      throw new ForbiddenException(
        "Vous n'avez pas accès aux paiements de cette location",
      );
    }

    const payments = await this.paymentsRepo.find({
      where: { tenancy: { id: tenancyId } },
      order: { mois: 'DESC' },
    });
    return Promise.all(payments.map((p) => this.refreshStatus(p)));
  }

  async markPaid(
    paymentId: string,
    dto: MarkPaidDto,
    user: User,
  ): Promise<Payment> {
    const payment = await this.paymentsRepo.findOne({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException('Paiement introuvable');
    }
    if (!this.canManageTenancy(payment.tenancy, user)) {
      throw new ForbiddenException(
        'Vous ne pouvez enregistrer que les paiements de vos propres locations',
      );
    }
    if (payment.statut === PaymentStatus.PAYE) {
      throw new BadRequestException('Ce paiement est déjà marqué comme payé');
    }

    payment.statut = PaymentStatus.PAYE;
    payment.methode = dto.methode;
    payment.datePaiement =
      dto.datePaiement ?? new Date().toISOString().slice(0, 10);
    payment.enregistrePar = user;
    return this.paymentsRepo.save(payment);
  }

  // --- Job planifié ---
  // Tous les jours à 6h : génère le paiement du mois pour chaque location
  // active, puis marque en retard celles qui ont dépassé l'échéance.
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async runDailyJob(): Promise<void> {
    await this.generateCurrentMonthForAllActiveTenancies();
  }

  async generateCurrentMonthForAllActiveTenancies(): Promise<number> {
    const mois = this.firstOfMonth(new Date());
    const activeTenancies = await this.tenanciesRepo.find({
      where: { statut: TenancyStatus.ACTIVE },
    });
    for (const tenancy of activeTenancies) {
      await this.generateForTenancyAndMonth(tenancy, mois);
    }
    return activeTenancies.length;
  }
}
