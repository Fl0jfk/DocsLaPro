import RollingSlider from "./components/Slider/RollingSlider";
import News from "./components/News/News";


export default function Home() {
  return (
    <main className="flex flex-col w-full text-xl md:pt-[7vh] sm:pt-[7vh]">
      <RollingSlider/>
      <News/>
    </main>
  );
}
