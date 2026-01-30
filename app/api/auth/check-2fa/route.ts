import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email en wachtwoord zijn verplicht" },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { email },
      select: {
        passwordHash: true,
        twoFactorEnabled: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Ongeldige inloggegevens" },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Ongeldige inloggegevens" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      requires2FA: user.twoFactorEnabled,
    })
  } catch (_error) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}
