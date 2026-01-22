import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import Hero from '@/components/marketing/hero'
import ProblemSolution from '@/components/marketing/problem-solution'
import Features from '@/components/marketing/features'
import HowItWorks from '@/components/marketing/how-it-works'
import CTA from '@/components/marketing/call-to-action'

export default async function RootPage() {
  const session = await auth()
  
  // Als gebruiker is ingelogd, redirect naar dashboard
  if (session?.user) {
    redirect("/dashboard")
  }
  
  // Anders toon marketing homepage
  return (
    <>
      <Hero />
      <ProblemSolution />
      <Features />
      <HowItWorks />
      <CTA />
    </>
  )
}
