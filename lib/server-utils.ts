import { getUserId } from "./get-session"

// Helper functie om de huidige user ID op te halen
// Gebruikt NextAuth session
export async function getCurrentUserId() {
  try {
    return await getUserId()
  } catch (error) {
    throw new Error("Niet ingelogd")
  }
}
