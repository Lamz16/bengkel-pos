import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const requiredEnvironment = ['INITIAL_OWNER_NAME', 'INITIAL_OWNER_EMAIL', 'INITIAL_OWNER_PASSWORD'] as const;

function readInitialOwner() {
  const missing = requiredEnvironment.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) throw new Error(`Seeder membutuhkan environment variable: ${missing.join(', ')}.`);

  const name = process.env.INITIAL_OWNER_NAME!.trim();
  const email = process.env.INITIAL_OWNER_EMAIL!.trim().toLowerCase();
  const password = process.env.INITIAL_OWNER_PASSWORD!;
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('INITIAL_OWNER_EMAIL harus berupa alamat email yang valid.');
  if (password.length < 8) throw new Error('INITIAL_OWNER_PASSWORD harus memiliki minimal 8 karakter.');
  return { name, email, password };
}

/** Creates exactly one initial Owner only when the user table is empty. */
export async function seedDatabase() {
  const initialOwner = readInitialOwner();
  await prisma.$transaction(async (tx) => {
    if (await tx.user.count() > 0) {
      console.log('Seeder dilewati: akun pengguna sudah tersedia.');
      return;
    }

    await tx.user.create({
      data: {
        name: initialOwner.name,
        email: initialOwner.email,
        password: await bcrypt.hash(initialOwner.password, 12),
        role: 'Owner',
        status: 'Active',
      },
    });
    console.log('Akun Owner awal berhasil dibuat.');
  }, { isolationLevel: 'Serializable' });
}

if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : 'Seeder gagal dijalankan.');
      process.exitCode = 1;
    })
    .finally(async () => prisma.$disconnect());
}
