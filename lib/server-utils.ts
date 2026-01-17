import { db } from "./db"

// Tijdelijke user ID - wordt later vervangen door auth
export const TEMP_USER_ID = "temp-user-id"

// Helper functie om de temp user op te halen of aan te maken
// Deze functie kan alleen in server-side code worden gebruikt
export async function getOrCreateTempUser() {
  let user = await db.user.findUnique({
    where: { id: TEMP_USER_ID },
  })

  if (!user) {
    user = await db.user.create({
      data: {
        id: TEMP_USER_ID,
        email: "temp@example.com",
        name: "Temp User",
        passwordHash: "temp", // Tijdelijk, wordt later vervangen door auth
        companyName: "Mijn Bedrijf",
        companyEmail: "info@voorbeeld.nl",
        companyAddress: "Straat 123",
        companyCity: "Amsterdam",
        companyPostalCode: "1000 AA",
        companyCountry: "Nederland",
        invoicePrefix: "FAC",
      },
    })
  }

  return user
}
