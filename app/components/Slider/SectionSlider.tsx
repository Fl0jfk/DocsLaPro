import Slider, { Category } from "./Slider";

type SectionSliderProps = { categories: Category[]};

export default function RollingSlider({ categories }: SectionSliderProps) {
  if (!categories || categories.length === 0) { return <div className="text-center py-4">Aucune catégorie disponible pour votre rôle</div>}
  return (
    <section id="slideshow" className="mx-auto w-full max-w-[1500px] self-center">
      <Slider items={categories} />
    </section>
  );
}