const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createUser() {
  try {
    console.log('👤 Creating user after database reset...');
    
    const userId = 'ef450138-b4ce-4dd6-aebd-80815a8446fd';
    const organizationId = '40e018a4-9716-41d0-806c-f7137152e00c';
    
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      console.log('📝 Creating user...');
      user = await prisma.user.create({
        data: {
          id: userId,
          email: 'rfernandez@hypernovalabs.com',
          password: 'hashed_password', // This would normally be properly hashed
          displayName: 'Raul Fernandez',
          emailVerified: true,
          organizationId: organizationId
        }
      });
      console.log('✅ User created:', user.id);
    } else {
      console.log('✅ User already exists:', user.id);
    }
    
    console.log('🎉 User data setup complete!');
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();