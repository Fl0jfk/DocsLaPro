"use client"

import { useState, useRef } from "react";
import Slide from "./Slide";

export default function Slider({ props }: SliderProps) {
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
  const handleMouseUp = () => { setIsDragging(false);};
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const x = e.pageX;
    const diffX = x - startX;
    const newScrollLeft = scrollLeft - diffX;
    containerRef.current.scrollLeft = newScrollLeft;
  };
  return (
    <div ref={containerRef} className="flex items-center overflow-x-scroll snap-x snap-mandatory cursor-grab select-none h-[650px]" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onMouseMove={handleMouseMove}>
      {props.map((categories) => {
        return <Slide name={categories.name} key={categories.id} link={categories.link} img={categories.img} shortDescription={categories.shortDescription} description={categories.description}/>
      })}
    </div>
  );
}

type SliderProps = {
  props: any[];
};