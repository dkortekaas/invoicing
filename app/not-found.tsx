"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/components/providers/locale-provider";

export default function NotFound() {
  const pathname = usePathname();
  const { t } = useTranslations("notFoundPage");
  const description = t("description").replace("{path}", pathname || "...");

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
        <h1 className="text-6xl font-bold tabular-nums text-primary md:text-7xl">
          404
        </h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground md:text-2xl">
          {t("title")}
        </h2>
        <p className="mt-3 text-muted-foreground">
          {description}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link href="/">
              <Home className="size-4" />
              {t("goHome")}
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="size-4" />
            {t("back")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
