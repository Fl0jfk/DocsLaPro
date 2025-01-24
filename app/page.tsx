import RollingSlider from "./components/Slider/RollingSlider";


export default function Home() {
  return (
    <main className="flex flex-col gap-4 p-4 w-full max-w-[1200px] mx-auto text-xl md:pt-[10vh] sm:pt-[10vh]">
      <RollingSlider/>
    </main>
  );
}
