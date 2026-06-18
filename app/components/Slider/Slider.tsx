"use client";

import { motion } from "framer-motion";
import type { Categories } from "@/app/contexts/data";
import DashboardTile from "../Dashboard/DashboardTile";

export type Category = Categories;

export type SliderProps = { items: Category[] };

const rowMotion = {
  hidden: { opacity: 0, x: -12 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.06, duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Slider({ items }: SliderProps) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      className="mx-auto flex w-full max-w-3xl flex-col gap-3"
    >
      {items.map((category, index) => (
        <motion.div
          key={category.id}
          custom={index}
          variants={rowMotion}
          whileHover={{ x: 4 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          <DashboardTile category={category} priority={index === 0} />
        </motion.div>
      ))}
    </motion.div>
  );
}
