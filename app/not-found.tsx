"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const pathname = usePathname();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", pathname);
  }, [pathname]);

  return (
      <div className="flex-1 flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-6"
        >
          <div className="text-8xl font-bold text-primary mb-4">404</div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Pagina niet gevonden
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            De pagina die je zoekt bestaat niet of is verplaatst.
          </p>
          <Link href="/">
            <Button className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Terug naar home
            </Button>
          </Link>
        </motion.div>
      </div>
  );
};

export default NotFound;