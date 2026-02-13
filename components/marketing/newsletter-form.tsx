"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { trackFormSuccess } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/components/providers/locale-provider";

export function NewsletterForm() {
  const { t } = useTranslations("footer");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || t("newsletter.error"));
        return;
      }

      trackFormSuccess("newsletter");
      setStatus("success");
      setMessage(data.message || t("newsletter.success"));
      setEmail("");
    } catch {
      setStatus("error");
      setMessage(t("newsletter.error"));
    }
  }

  if (status === "success") {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <p>{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder={t("newsletter.placeholder")}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          required
          className="h-9 bg-background/50 text-sm"
          aria-label={t("newsletter.placeholder")}
        />
        <Button
          type="submit"
          size="sm"
          disabled={status === "loading"}
          className="h-9 shrink-0 px-3"
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span className="sr-only">{t("newsletter.subscribe")}</span>
        </Button>
      </div>
      {status === "error" && (
        <p className="text-xs text-destructive">{message}</p>
      )}
    </form>
  );
}
