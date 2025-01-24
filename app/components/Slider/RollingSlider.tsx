"use client"

import { useData } from "@/app/contexts/data";
import Slider from "./Slider";

export default function RollingSlider (){
    const data = useData();
    return (      
        <section id="slideshow" className="w-full self-center mx-auto">
            <Slider props={data.categories}/>
        </section>
        
        
    )
}