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
  const ImageBlock = (
    img && (
      <Image src={img} fill alt={name} sizes="35vw" priority={priority} fetchPriority={priority ? "high" : "auto"} className="rounded-3xl select-none pointer-events-none object-contain"/>
    )
  );
  const content = (
    <>
      <div className="flex flex-col gap-1 z-[2]">
        <p className="sm:max-md:text-3xl text-2xl font-bold">{name}</p>
      </div>
      {ImageBlock}
    </>
  );
  const baseClass ="bg-white select-none flex items-end h-[350px] md:max-lg:h-[300px] sm:max-md:h-[450px] min-w-[250px] rounded-3xl m-3 p-4 relative overflow-hidden transition-transform duration-300 ease-in-out xl:hover:scale-105";
  return external ? (
    <a href={link} target="_blank" rel="noopener noreferrer" className={baseClass}>
      {content}
    </a>
  ) : (
    <Link href={link} className={baseClass}>
      {content}
    </Link>
  );
}
