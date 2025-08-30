import { createUploadthing, type FileRouter } from "uploadthing/next";
import * as jose from 'jose';

const f = createUploadthing();

// Función para autenticar usuario
const auth = async (req: Request) => {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return null;

    const token = authHeader.replace('Bearer ', '');
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'super-secret-key-for-debugging-only'
    );

    const { payload } = await jose.jwtVerify(token, secret);
    return { 
      id: payload.userId as string, 
      email: payload.email as string 
    };
  } catch {
    return null;
  }
};

// FileRouter para tu aplicación
export const ourFileRouter = {
  // Define upload de logos de organizaciones
  organizationLogo: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      
      if (!user) throw new Error("No autorizado");
      
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ [UPLOADTHING] Organization logo uploaded:", file.url);
      console.log("👤 [UPLOADTHING] User ID:", metadata.userId);
      
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // Define upload de imágenes de portada
  organizationCover: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      
      if (!user) throw new Error("No autorizado");
      
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ [UPLOADTHING] Organization cover uploaded:", file.url);
      console.log("👤 [UPLOADTHING] User ID:", metadata.userId);
      
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // Define upload de avatares de usuario
  userAvatar: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      
      if (!user) throw new Error("No autorizado");
      
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ [UPLOADTHING] User avatar uploaded:", file.url);
      console.log("👤 [UPLOADTHING] User ID:", metadata.userId);
      
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;