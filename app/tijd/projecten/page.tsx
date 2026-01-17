import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/get-session';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/time/formatters';

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  
  if (!user?.id) {
    return null;
  }

  const projects = await db.project.findMany({
    where: {
      userId: user.id,
      archived: false,
    },
    include: {
      customer: true,
      _count: {
        select: { timeEntries: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projecten</h1>
          <p className="text-muted-foreground">
            Beheer je projecten en koppel tijdregistraties
          </p>
        </div>

        <Button asChild>
          <Link href="/tijd/projecten/nieuw">
            <Plus className="mr-2 h-4 w-4" />
            Nieuw project
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {project.color && (
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                    )}
                    <h3 className="font-semibold">{project.name}</h3>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Klant:</span>
                  <span>{project.customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span>{project.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entries:</span>
                  <span>{project._count.timeEntries}</span>
                </div>
                {project.defaultHourlyRate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tarief:</span>
                    <span>{formatCurrency(Number(project.defaultHourlyRate))}/u</span>
                  </div>
                )}
              </div>

              <Button variant="outline" className="w-full" asChild>
                <Link href={`/tijd/projecten/${project.id}`}>
                  Bekijk details
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nog geen projecten aangemaakt</p>
          <Button asChild className="mt-4">
            <Link href="/tijd/projecten/nieuw">
              <Plus className="mr-2 h-4 w-4" />
              Eerste project aanmaken
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
