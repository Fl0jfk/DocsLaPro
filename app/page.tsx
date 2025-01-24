import RollingSlider from "./components/Slider/RollingSlider";


export default function Home() {
  return (
    <main className="flex flex-col gap-4 p-4 w-full max-w-[1200px] mx-auto text-xl md:pt-[15vh] sm:pt-[15vh]">
      <RollingSlider/>
    </main>
  );
}
