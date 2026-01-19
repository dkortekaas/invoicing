import { NextRequest, NextResponse } from "next/server"
import { logLogout } from "@/lib/audit/helpers"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (session?.user) {
      // Log logout action
      await logLogout(session.user.email!, session.user.id)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout logging error:", error)
    // Don't fail the logout if logging fails
    return NextResponse.json({ success: true })
  }
}
