"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import staffData from "./organigramme.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StaffBubble({ person, isFlipped, onClick }: any) {
  return (
    <motion.div
      className="w-[230px] h-[230px] rounded-full shadow-xl cursor-pointer relative preserve-3d"
      onClick={onClick}
      whileHover={{ scale: 1.15 }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="absolute inset-0 flex flex-col items-center rounded-full overflow-hidden backface-hidden"
          style={{
            backgroundColor: person.color,
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
          }}
        >
          <img
            src={person.image}
            className="w-[150px] h-[150px] object-cover rounded-full mt-2"
          />
          <p className="text-lg text-center break-words whitespace-normal">
            {person.name}
          </p>
          <p className="text-sm text-center break-words whitespace-normal w-[60%]">
            {person.role}
          </p>
        </div>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-white rounded-full p-2 text-center"
          style={{
            backgroundColor: person.color,
            transform: "rotateY(180deg)",
            WebkitBackfaceVisibility: "hidden",
            backfaceVisibility: "hidden",
          }}
        >
          <p className="font-bold text-center break-words whitespace-normal">
            {person.name}
          </p>
          <p className="text-sm text-center break-words whitespace-normal">
            {person.role}
          </p>
          <a
            href={`mailto:${person.email}`}
            className="text-xs underline hover:text-gray-200"
          >
            {person.email}
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Organigramme() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  return (
    <section className="flex justify-center items-center">
      <div className="p-6 space-y-10">
        {Object.entries(staffData).map(([section, people], sectionIndex) => (
          <div className="text-center flex flex-col" key={section}>
            <div>
              <h2 className="text-xl font-bold mb-4 capitalize">
                {section.replace("_", " ")}
              </h2>
            </div>
            <div className="flex gap-6 flex-wrap justify-center">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
              {people.map((p: any, i: number) => {
                const globalIndex = `${sectionIndex}-${i}`;
                return (
                  <StaffBubble
                    key={globalIndex}
                    person={p}
                    isFlipped={openIndex === globalIndex}
                    onClick={() =>
                      setOpenIndex(openIndex === globalIndex ? null : globalIndex)
                    }
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
