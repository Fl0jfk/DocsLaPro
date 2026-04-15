import Image from "next/image";
import Link from "next/link";

type SliderProps = {
  name: string;
  img: string;
  link: string;
  external?: boolean;
  priority?: boolean;
};

export default function Slide({ name, img, link, external, priority = false,}: SliderProps) {
  const isPriorityImage = priority || img.includes("reservationsalle.jpg");
  const ImageBlock = ( img && (<Image src={img} fill alt={name} sizes="35vw" priority={isPriorityImage} fetchPriority={isPriorityImage ? "high" : "auto"} className="rounded-3xl select-none pointer-events-none object-contain"/>));
  const content = (
    <>
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/5 to-transparent z-[1] pointer-events-none" />
      <div className="flex flex-col gap-1 z-[2]">
        <p className="sm:max-md:text-3xl text-2xl font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">{name}</p>
      </div>
      {ImageBlock}
    </>
  );
  const baseClass ="bg-white border-1 shadow-xs hover:shadow-lg border-gray-200 select-none flex items-end h-[350px] md:max-lg:h-[300px] sm:max-md:h-[450px] min-w-[250px] rounded-3xl m-3 p-4 relative overflow-hidden transition-transform duration-300 ease-in-out xl:hover:scale-105";
  return external ? (
    <a href={link} target="_blank" rel="noopener noreferrer" className={baseClass}>{content}</a>
  ) : (
    <Link href={link} className={baseClass}>{content}</Link>
  );
}
