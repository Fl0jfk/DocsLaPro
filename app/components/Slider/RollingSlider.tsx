import Slider, { Category } from "./Slider";
type RollingSliderProps = {
  categories: Category[];
};
export default function RollingSlider({ categories }: RollingSliderProps) {
  if (!categories || categories.length === 0) {
    return <div className="text-center py-4">Aucune catégorie disponible pour votre rôle</div>;
  }
  return (
    <section id="slideshow" className="w-full self-center mx-auto">
      <Slider items={categories} />
    </section>
  );
}