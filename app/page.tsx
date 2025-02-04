import RollingSlider from "./components/Slider/RollingSlider";
import News from "./components/News/News";


export default function Home() {
  return (
    <main className="flex flex-col gap-4 py-4 w-full text-xl md:pt-[10vh] sm:pt-[10vh]">
      <RollingSlider/>
      <News/>
    </main>
  );
}
