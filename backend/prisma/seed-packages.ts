import prisma from '../src/config/database';

/**
 * Idempotent package seed — mirrors the 15 live JabClub packages.
 *
 * SAFE to run against production: it does NOT delete anything. For each package it
 * updates the existing row (matched by exact name) or creates it if missing. Members,
 * bookings, payments and existing member-packages are never touched.
 *
 * Run:  cd backend && npx ts-node prisma/seed-packages.ts
 *
 * NOTE: names are copied verbatim from production, including the "SESSTIONS" spelling,
 * so this stays in sync with the live data and never creates duplicate variants.
 */
const PACKAGES: Array<{ name: string; sessionCount: number; price: number; expiryDays: number }> = [
  { name: 'DROP IN - ADULTS', sessionCount: 1, price: 650, expiryDays: 1 },
  { name: 'DROP IN - KIDS', sessionCount: 1, price: 500, expiryDays: 1 },
  { name: 'BASIC - 4 SESSTIONS', sessionCount: 4, price: 2400, expiryDays: 15 },
  { name: 'BASIC - 8 SESSTIONS', sessionCount: 8, price: 3200, expiryDays: 30 },
  { name: 'BASIC KIDS PACKAGE - 8 SESSTIONS', sessionCount: 8, price: 2400, expiryDays: 30 },
  { name: 'STANDARD - 12 SESSTIONS', sessionCount: 12, price: 3990, expiryDays: 30 },
  { name: 'STANDARD KIDS PACKAGE - 12 SESSTIONS', sessionCount: 12, price: 3050, expiryDays: 30 },
  { name: 'STANDARD - 16 SESSTIONS', sessionCount: 16, price: 4800, expiryDays: 42 },
  { name: 'STANDARD KIDS PACKAGE - 16 SESSTIONS', sessionCount: 16, price: 3900, expiryDays: 42 },
  { name: 'PREMIUM KIDS PACKAGE - 20 SESSTIONS', sessionCount: 20, price: 4550, expiryDays: 45 },
  { name: 'PREMIUM - 20 SESSTIONS', sessionCount: 20, price: 5600, expiryDays: 42 },
  { name: 'PREMIUM - 24 SESSTIONS', sessionCount: 24, price: 6400, expiryDays: 60 },
  { name: 'PREMIUM KIDS PACKAGE - 24 SESSTIONS', sessionCount: 24, price: 5350, expiryDays: 60 },
  { name: 'PREMIUM KIDS PACKAGE- 36 SESSTIONS', sessionCount: 36, price: 7550, expiryDays: 60 },
  { name: 'PREMIUM PACK - 36 SESSTIONS', sessionCount: 36, price: 8800, expiryDays: 60 },
];

async function main() {
  let created = 0;
  let updated = 0;

  for (const p of PACKAGES) {
    const existing = await prisma.sessionPackage.findFirst({ where: { name: p.name } });
    if (existing) {
      await prisma.sessionPackage.update({
        where: { id: existing.id },
        data: {
          sessionCount: p.sessionCount,
          price: p.price,
          expiryDays: p.expiryDays,
          isActive: true,
        },
      });
      updated++;
      console.log(`✓ updated: ${p.name}`);
    } else {
      await prisma.sessionPackage.create({
        data: {
          name: p.name,
          sessionCount: p.sessionCount,
          price: p.price,
          expiryDays: p.expiryDays,
          isActive: true,
        },
      });
      created++;
      console.log(`+ created: ${p.name}`);
    }
  }

  const total = await prisma.sessionPackage.count();
  console.log(`\nDone. created=${created}, updated=${updated}, total packages now=${total}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
