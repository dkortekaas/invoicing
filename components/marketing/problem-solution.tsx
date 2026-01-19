"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Clock, FileWarning, BarChart3, ArrowRight, CheckCircle2 } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Te laat betalen",
    description: "Klanten die maar blijven wachten met betalen.",
  },
  {
    icon: FileWarning,
    title: "Gedoe met facturen",
    description: "Eindeloos klooien met Word en Excel.",
  },
  {
    icon: BarChart3,
    title: "Geen overzicht",
    description: "Wie heeft al betaald? Geen idee.",
  },
];

const ProblemSolution = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative bg-muted/30">
      <div className="container-tight section-padding">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Problems */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Het probleem
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-2 mb-8">
              Herkenbaar?
            </h2>
            
            <div className="space-y-6">
              {problems.map((problem, index) => (
                <motion.div
                  key={problem.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-background border border-border/50"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <problem.icon className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{problem.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{problem.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Solution */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl blur-xl" />
            <div className="relative bg-background border border-primary/20 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                    De oplossing
                  </span>
                  <h2 className="text-2xl font-bold text-foreground">
                    BetaalMe regelt het
                  </h2>
                </div>
              </div>

              <ul className="space-y-4">
                {[
                  "Professionele facturen in seconden",
                  "Automatische betaalherinneringen",
                  "iDEAL-betaallink op elke factuur",
                  "Altijd overzicht van je geld",
                ].map((item, index) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.4 + 0.1 * index }}
                    className="flex items-center gap-3"
                  >
                    <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-foreground font-medium">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolution;
