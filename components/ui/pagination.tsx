'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
}

export function Pagination({ totalItems, pageSize, currentPage }: PaginationProps) {
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) return null;

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '?';
  }

  // Show max 5 page buttons around current
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);

  const pages: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <nav className="flex items-center justify-between pt-4" aria-label="Paginering">
      <p className="text-sm text-muted-foreground">
        {totalItems} resultaten — pagina {currentPage} van {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={currentPage <= 1}
        >
          <Link
            href={buildHref(currentPage - 1)}
            aria-label="Vorige pagina"
            aria-disabled={currentPage <= 1}
            tabIndex={currentPage <= 1 ? -1 : undefined}
            className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>

        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? 'default' : 'outline'}
            size="sm"
            asChild
          >
            <Link href={buildHref(page)} aria-current={page === currentPage ? 'page' : undefined}>
              {page}
            </Link>
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={currentPage >= totalPages}
        >
          <Link
            href={buildHref(currentPage + 1)}
            aria-label="Volgende pagina"
            aria-disabled={currentPage >= totalPages}
            tabIndex={currentPage >= totalPages ? -1 : undefined}
            className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </nav>
  );
}
