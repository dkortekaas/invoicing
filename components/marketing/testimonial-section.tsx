"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    content:
      "Eindelijk een app die snapt hoe Nederlandse ondernemers werken. Mijn BTW-aangifte kost me nu 5 minuten in plaats van een hele avond.",
    author: "Marieke de V.",
    role: "Grafisch ontwerper",
    rating: 5,
  },
  {
    content:
      "Sinds ik Declair gebruik worden mijn facturen gemiddeld 2 weken sneller betaald. Die iDEAL-link is goud waard.",
    author: "Thomas K.",
    role: "Marketing consultant",
    rating: 5,
  },
  {
    content:
      "Ik haat administratie. Maar met Declair merk ik er bijna niets meer van. Bonnetje scannen, klaar.",
    author: "Sophie B.",
    role: "Fotograaf",
    rating: 5,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const TestimonialsSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Wat ondernemers zeggen
          </h2>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={item}
              className="bg-card rounded-2xl border border-border p-6 md:p-8"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-warning text-warning"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground leading-relaxed mb-6">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">
                    {testimonial.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">
                    {testimonial.author}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;