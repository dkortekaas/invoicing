import { NextRequest, NextResponse } from "next/server"
import { unlink } from "fs/promises"
import { join } from "path"
import { getCurrentUserId } from "@/lib/server-utils"
import { db } from "@/lib/db"

export async function DELETE(_request: NextRequest) {
  try {
    const userId = await getCurrentUserId()

    // Get current user's company logo
    const company = await db.company.findUnique({
      where: { userId },
      select: { logo: true },
    })

    if (!company || !company.logo) {
      return NextResponse.json({ error: "Geen logo gevonden" }, { status: 404 })
    }

    // Delete file from filesystem
    const filepath = join(process.cwd(), "public", company.logo)
    try {
      await unlink(filepath)
    } catch (error) {
      // File might not exist, continue anyway
      console.warn("Could not delete logo file:", error)
    }

    // Update database
    await db.company.update({
      where: { userId },
      data: { logo: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete logo error:", error)
    return NextResponse.json(
      { error: "Fout bij verwijderen logo" },
      { status: 500 }
    )
  }
}
