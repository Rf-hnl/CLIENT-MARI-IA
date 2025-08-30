#!/usr/bin/env node

/**
 * Script para arreglar membresías faltantes de organizaciones
 * 
 * Este script encuentra usuarios que son owners de organizaciones
 * pero no tienen membresía en organizationMember y las crea automáticamente.
 */

const { PrismaClient, Role } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOrganizationMemberships() {
  console.log('🔧 [FIX MEMBERSHIPS] Iniciando reparación de membresías...');

  try {
    // Encontrar todas las organizaciones
    const organizations = await prisma.organization.findMany({
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    console.log(`📊 [FIX MEMBERSHIPS] Encontradas ${organizations.length} organizaciones para revisar`);

    const membershipsToCreate = [];

    for (const org of organizations) {
      if (!org.ownerId || !org.owner) continue;

      // Verificar si el owner ya tiene membresía
      const existingMembership = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: org.ownerId,
            organizationId: org.id
          }
        }
      });

      if (!existingMembership) {
        membershipsToCreate.push({
          organizationId: org.id,
          organizationName: org.name,
          ownerId: org.ownerId,
          ownerEmail: org.owner.email,
          ownerName: org.owner.name || org.owner.email
        });
      }
    }

    console.log(`🎯 [FIX MEMBERSHIPS] Encontradas ${membershipsToCreate.length} membresías faltantes`);

    if (membershipsToCreate.length === 0) {
      console.log('✅ [FIX MEMBERSHIPS] Todas las membresías están correctas. No hay nada que arreglar.');
      return;
    }

    // Mostrar lo que se va a crear
    console.log('\n📋 [FIX MEMBERSHIPS] Membresías que se van a crear:');
    membershipsToCreate.forEach((membership, index) => {
      console.log(`  ${index + 1}. ${membership.ownerName} (${membership.ownerEmail}) -> ${membership.organizationName}`);
    });

    console.log('\n🔄 [FIX MEMBERSHIPS] Creando membresías...');

    // Crear las membresías en una transacción
    const result = await prisma.$transaction(async (tx) => {
      const createdMemberships = [];

      for (const membership of membershipsToCreate) {
        const newMembership = await tx.organizationMember.create({
          data: {
            userId: membership.ownerId,
            organizationId: membership.organizationId,
            role: Role.OWNER
          },
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            },
            organization: {
              select: {
                name: true
              }
            }
          }
        });

        createdMemberships.push(newMembership);
        console.log(`  ✅ Creada membresía: ${newMembership.user.email} -> ${newMembership.organization.name} (OWNER)`);
      }

      return createdMemberships;
    });

    console.log(`\n🎉 [FIX MEMBERSHIPS] ¡Completado! Se crearon ${result.length} membresías exitosamente.`);
    console.log('\n📝 [FIX MEMBERSHIPS] Resumen:');
    result.forEach((membership, index) => {
      console.log(`  ${index + 1}. ${membership.user.name} ahora es OWNER de "${membership.organization.name}"`);
    });

  } catch (error) {
    console.error('❌ [FIX MEMBERSHIPS] Error durante la reparación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixOrganizationMemberships()
    .then(() => {
      console.log('\n✨ [FIX MEMBERSHIPS] Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 [FIX MEMBERSHIPS] Script falló:', error);
      process.exit(1);
    });
}

module.exports = { fixOrganizationMemberships };