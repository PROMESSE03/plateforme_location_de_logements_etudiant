// Usage : npx ts-node -r dotenv/config src/scripts/make-admin.ts email@exemple.com
//
// Un compte admin n'est jamais créé via l'inscription publique (/auth/register)
// pour des raisons de sécurité évidentes. Il faut d'abord créer un compte normal,
// puis utiliser ce script pour lui ajouter le rôle ROLE_ADMIN.
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { Listing } from '../listings/entities/listing.entity';
import { ListingPhoto } from '../listings/entities/listing-photo.entity';
import { RoleType } from '../common/enums/role.enum';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx ts-node -r dotenv/config src/scripts/make-admin.ts <email>');
    process.exit(1);
  }

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User, UserRole, Listing, ListingPhoto],
  });

  await dataSource.initialize();

  const usersRepo = dataSource.getRepository(User);
  const rolesRepo = dataSource.getRepository(UserRole);

  const user = await usersRepo.findOne({ where: { email } });
  if (!user) {
    console.error(`Aucun utilisateur trouvé avec l'email ${email}`);
    console.error('Crée d\'abord un compte via POST /auth/register.');
    await dataSource.destroy();
    process.exit(1);
  }

  const alreadyAdmin = user.roles.some((r) => r.role === RoleType.ADMIN);
  if (alreadyAdmin) {
    console.log(`${email} est déjà admin.`);
  } else {
    const newRole = rolesRepo.create({ user, role: RoleType.ADMIN });
    await rolesRepo.save(newRole);
    console.log(`✅ ${email} est maintenant ROLE_ADMIN.`);
  }

  await dataSource.destroy();
}

main();
