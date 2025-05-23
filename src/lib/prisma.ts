import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { level: "warn", emit: "stdout" },
      { level: "error", emit: "stdout" },
      { level: "info", emit: "stdout" },
    ],
  });

// Log slow queries in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;

  // Add query performance logging
  prisma.$use(async (params, next) => {
    const start = performance.now();
    const result = await next(params);
    const end = performance.now();
    const duration = end - start;

    if (duration > 500) {
      // Log queries that take more than 500ms
      console.warn(`Slow query (${duration.toFixed(2)}ms):`, {
        model: params.model,
        action: params.action,
        args: params.args,
      });
    }

    return result;
  });
}

// Enable soft shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
