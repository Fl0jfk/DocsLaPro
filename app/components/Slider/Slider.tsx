"use client"

import { useState, useRef } from "react";
import type { Categories } from "@/app/contexts/data";
import DashboardTile from "../Dashboard/DashboardTile";

export type Category = Categories;

export type SliderProps = { items: Category[]};

export default function Slider({ items }: SliderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const handleMouseDown = (e: React.MouseEvent) => {
    if (containerRef.current) {
      setIsDragging(true);
      setStartX(e.pageX);
      setScrollLeft(containerRef.current.scrollLeft);
    }
  };
  const handleMouseUp = () => { setIsDragging(false); };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const x = e.pageX;
    const diffX = x - startX;
    const newScrollLeft = scrollLeft - diffX;
    containerRef.current.scrollLeft = newScrollLeft;
  };
  return (
    <div ref={containerRef} className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 select-none h-full w-full mx-auto" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onMouseMove={handleMouseMove}>
      {items.map((category, index) => (
        <DashboardTile key={category.id} category={category} priority={index === 0} />
      ))}
    </div>
  );
}
