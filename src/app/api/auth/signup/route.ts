// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();

  // 1) Basic validation
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  // 2) Early exit on existing email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "User with this email already exists" },
      { status: 409 }
    );
  }

  // 3) Hash & create inside a try/catch
  try {
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, password: hashed, name },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: any) {
    // Log everything so you can inspect err.code / err.meta / err.message
    console.error("Signup error:", {
      code: err.code,
      meta: err.meta,
      message: err.message,
    });

    // 4) Handle Prisma unique-constraint (P2002) or generic “unique constraint failed” text
    if (
      err.code === "P2002" ||
      (typeof err.message === "string" &&
        err.message.includes("Unique constraint failed"))
    ) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // 5) Everything else → 500
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
