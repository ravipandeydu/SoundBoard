import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Perform a simple query to warm up the connection
    await prisma.user.count();

    return NextResponse.json({ status: "Database connection warmed up" });
  } catch (error) {
    console.error("Warmup error:", error);
    return NextResponse.json(
      { error: "Failed to warm up database connection" },
      { status: 500 }
    );
  }
}
