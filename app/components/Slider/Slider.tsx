"use client"

import { useState, useRef } from "react";
import Slide from "./Slide";

export type Category = {
  id: number;
  name: string;
  link: string;
  img: string;
  external?: boolean;
};

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
    <div ref={containerRef} className="xl:grid-cols-4 lg:grid-cols-3 grid md:grid-cols-3 sm:flex sm:items-center sm:overflow-x-scroll sm:snap-x sm:snap-mandatory sm:cursor-grab select-none sm:h-[550px]" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onMouseMove={handleMouseMove}>
      {items.map((category, index) => (
        <Slide name={category.name} key={category.id} link={category.link} img={category.img} external={category.external} priority={index === 0}/>
      ))}
    </div>
  );
}
