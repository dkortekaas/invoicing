import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import MarketingContentLoader from '@/components/marketing/marketing-content-loader';

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <main id="main-content" className="min-h-[50vh]">
      <MarketingContentLoader />
    </main>
  );
}
