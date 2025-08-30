import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding basic data...`);

  // Create a default user first
  const defaultUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'System Admin',
      hashedPassword: 'placeholder',
    },
  });
  console.log(`Created or found user: ${defaultUser.email}`);

  // Create a default tenant
  const defaultTenant = await prisma.tenant.upsert({
    where: { slug: 'default-tenant' },
    update: {},
    create: {
      name: 'Default Tenant',
      slug: 'default-tenant',
      plan: 'basic',
      ownerId: defaultUser.id,
    },
  });
  console.log(`Created or found tenant: ${defaultTenant.name}`);
  
  console.log(`✅ ElevenLabs configuration is now handled via environment variables:`);
  console.log(`- ELEVENLABS_API_KEY`);
  console.log(`- ELEVENLABS_AGENT_ID`); 
  console.log(`- ELEVENLABS_PHONE_ID`);
  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
