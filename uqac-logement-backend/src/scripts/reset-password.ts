// Usage : npm run reset-password -- email@exemple.com nouveaumotdepasse
//
// Il n'y a pas encore de fonctionnalité "mot de passe oublié" automatique
// (ça demanderait un service d'envoi de courriels). En attendant, ce
// script permet à un admin de fixer un nouveau mot de passe temporaire
// pour un compte bloqué.
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { Listing } from '../listings/entities/listing.entity';
import { ListingPhoto } from '../listings/entities/listing-photo.entity';
import { Room } from '../rooms/entities/room.entity';
import { Tenancy } from '../tenancies/entities/tenancy.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Interest } from '../interests/entities/interest.entity';

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error(
      'Usage: npm run reset-password -- <email> <nouveau_mot_de_passe>',
    );
    process.exit(1);
  }
  if (newPassword.length < 8) {
    console.error('Le mot de passe doit contenir au moins 8 caractères.');
    process.exit(1);
  }

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [
      User,
      UserRole,
      Listing,
      ListingPhoto,
      Room,
      Tenancy,
      Payment,
      Interest,
    ],
  });

  await dataSource.initialize();
  const usersRepo = dataSource.getRepository(User);

  const user = await usersRepo.findOne({ where: { email } });
  if (!user) {
    console.error(`Aucun utilisateur trouvé avec l'email ${email}`);
    await dataSource.destroy();
    process.exit(1);
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await usersRepo.save(user);

  console.log(`✅ Mot de passe de ${email} réinitialisé avec succès.`);
  await dataSource.destroy();
}

main();
