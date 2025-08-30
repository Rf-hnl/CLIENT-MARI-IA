import { ApiKey, Permission } from '@prisma/client';
import { prisma as db } from '@/lib/prisma'; // Usamos el alias para consistencia y evitar errores de resolución.
import { randomBytes, createHash, timingSafeEqual } from 'crypto';

/**
 * Genera un hash SHA-256 para una clave secreta.
 * @param secret La parte secreta de la API key.
 * @returns El hash en formato hexadecimal.
 */
const hashSecret = (secret: string): string => {
  return createHash('sha256').update(secret).digest('hex');
};

/**
 * Crea y almacena una nueva API key en la base de datos.
 * Ideal para usar en un panel de administración.
 *
 * @param name Un nombre descriptivo para la clave.
 * @param organizationId El ID de la organización a la que pertenece.
 * @param tenantId El ID del tenant al que pertenece.
 * @param permissions Un array de permisos para la clave.
 * @returns La API key completa (ej. "mia_pub_xxxxxxxx_yyyyyyyyyyyy").
 *          **IMPORTANTE: Este es el único momento en que la clave completa será visible.**
 */
export const createApiKey = async (
  name: string,
  organizationId: string,
  tenantId: string,
  permissions: Permission[] = [Permission.LEAD_CREATE]
): Promise<string> => {
  // Genera un prefijo único para la búsqueda en la BD
  const prefix = `mia_pub_${randomBytes(8).toString('hex')}`;
  
  // Genera la parte secreta de la clave
  const secret = randomBytes(24).toString('hex');
  
  // La clave completa que se le mostrará al usuario
  const fullKey = `${prefix}_${secret}`;
  
  // El hash del secreto que se almacenará en la BD
  const hashedSecret = hashSecret(secret);

  await db.apiKey.create({
    data: {
      name,
      organizationId,
      tenantId,
      prefix,
      hashedKey: hashedSecret,
      permissions,
    },
  });

  return fullKey;
};

/**
 * Valida una API key y verifica que tenga un permiso específico.
 *
 * @param authorizationHeader El valor del encabezado 'Authorization' (ej. "Bearer mia_pub_..._...").
 * @param requiredPermission El permiso que la clave debe tener.
 * @returns Un objeto con la instancia de ApiKey o un mensaje de error.
 */
export const validateApiKeyAndPermissions = async (
  authorizationHeader: string | undefined | null,
  requiredPermission: Permission
): Promise<{ apiKey: ApiKey | null; error: string | null }> => {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return { apiKey: null, error: 'Encabezado de autorización ausente o mal formado.' };
  }

  const keyWithValue = authorizationHeader.substring(7); // Elimina "Bearer "
  const lastUnderscoreIndex = keyWithValue.lastIndexOf('_');

  if (lastUnderscoreIndex === -1) {
    return { apiKey: null, error: 'Formato de API Key inválido. Se esperaba prefix_secret.' };
  }

  const prefix = keyWithValue.substring(0, lastUnderscoreIndex);
  const secret = keyWithValue.substring(lastUnderscoreIndex + 1);

  if (!prefix || !secret) {
    return { apiKey: null, error: 'Formato de API Key inválido.' };
  }

  const apiKeyRecord = await db.apiKey.findUnique({
    where: { prefix },
  });

  if (!apiKeyRecord) {
    return { apiKey: null, error: 'API Key inválida.' };
  }

  const hashedSecret = hashSecret(secret);

  // Compara los hashes de forma segura para prevenir ataques de temporización (timing attacks)
  const keyMatch = timingSafeEqual(
    Buffer.from(apiKeyRecord.hashedKey),
    Buffer.from(hashedSecret)
  );

  if (!keyMatch) {
    return { apiKey: null, error: 'API Key inválida.' };
  }

  if (!apiKeyRecord.isActive) {
    return { apiKey: null, error: 'La API Key está inactiva.' };
  }

  if (apiKeyRecord.expiresAt && new Date() > apiKeyRecord.expiresAt) {
    return { apiKey: null, error: 'La API Key ha expirado.' };
  }

  if (!apiKeyRecord.permissions.includes(requiredPermission)) {
    return { apiKey: null, error: 'La API Key no tiene los permisos requeridos.' };
  }

  // Actualiza la fecha de último uso (sin esperar la respuesta)
  db.apiKey.update({
    where: { id: apiKeyRecord.id },
    data: { lastUsedAt: new Date() },
  }).catch(console.error);

  return { apiKey: apiKeyRecord, error: null };
};
