import TileShell from "@/app/components/Dashboard/TileShell";

type SliderProps = {
  name: string;
  img: string;
  link: string;
  external?: boolean;
  priority?: boolean;
};

export default function Slide({ name, img, link, external, priority = false }: SliderProps) {
  return (
    <TileShell
      name={name}
      img={img}
      link={link}
      external={external}
      priority={priority}
    />
  );
}
