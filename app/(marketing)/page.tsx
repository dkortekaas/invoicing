import Hero from '@/components/marketing/hero';
import ProblemSolution from '@/components/marketing/problem-solution';
import Features from '@/components/marketing/features';
import HowItWorks from '@/components/marketing/how-it-works';
import CTA from '@/components/marketing/call-to-action';

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemSolution />
      <Features />
      <HowItWorks />
      <CTA />
    </>
  );
}
