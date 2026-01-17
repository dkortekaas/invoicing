import { NextRequest, NextResponse } from "next/server"
import { unlink } from "fs/promises"
import { join } from "path"
import { getCurrentUserId } from "@/lib/server-utils"
import { db } from "@/lib/db"

export async function DELETE(_request: NextRequest) {
  try {
    const userId = await getCurrentUserId()

    // Get current user's logo
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { companyLogo: true },
    })

    if (!user || !user.companyLogo) {
      return NextResponse.json({ error: "Geen logo gevonden" }, { status: 404 })
    }

    // Delete file from filesystem
    const filepath = join(process.cwd(), "public", user.companyLogo)
    try {
      await unlink(filepath)
    } catch (error) {
      // File might not exist, continue anyway
      console.warn("Could not delete logo file:", error)
    }

    // Update database
    await db.user.update({
      where: { id: userId },
      data: { companyLogo: null },
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
