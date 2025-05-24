import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    // Optimize for production
    ...(process.env.NODE_ENV === "production"
      ? {
          errorFormat: "minimal",
          datasources: {
            db: {
              url: process.env.DATABASE_URL,
            },
          },
        }
      : {}),
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Enable soft shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
