"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex max-w-md flex-col items-center text-center"
      >
        <p className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Fout 500
        </p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-6xl font-bold tabular-nums text-destructive md:text-7xl">
            500
          </span>
          <AlertCircle className="size-10 text-destructive md:size-12" aria-hidden />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-foreground md:text-2xl">
          Er ging iets mis
        </h2>
        <p className="mt-3 text-muted-foreground">
          Er is een onverwachte fout opgetreden. Probeer de pagina te vernieuwen of ga terug naar
          het startscherm.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={reset} className="gap-2">
            <RefreshCw className="size-4" />
            Opnieuw proberen
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/">
              <Home className="size-4" />
              Naar home
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
