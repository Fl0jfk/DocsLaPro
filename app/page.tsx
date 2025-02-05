import RollingSlider from "./components/Slider/RollingSlider";
import News from "./components/News/News";


export default function Home() {
  return (
    <main className="flex flex-col gap-4 py-4 w-full text-xl md:pt-[8vh] sm:pt-[8vh]">
      <RollingSlider/>
      <News/>
    </main>
  );
}
