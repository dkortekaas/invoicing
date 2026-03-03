"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslations } from "@/components/providers/locale-provider";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslations("errorPage");

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
          {t("label")}
        </p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-6xl font-bold tabular-nums text-destructive md:text-7xl">
            500
          </span>
          <AlertCircle className="size-10 text-destructive md:size-12" aria-hidden />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-foreground md:text-2xl">
          {t("title")}
        </h2>
        <p className="mt-3 text-muted-foreground">
          {t("description")}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={reset} className="gap-2">
            <RefreshCw className="size-4" />
            {t("tryAgain")}
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/">
              <Home className="size-4" />
              {t("goHome")}
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
