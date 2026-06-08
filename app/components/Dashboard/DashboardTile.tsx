"use client";

import type { Categories } from "@/app/contexts/data";
import Slide from "../Slider/Slide";
import AbsencesCalendarTile from "./AbsencesCalendarTile";
import AgentIATile from "./AgentIATile";
import ProfRoomTile from "./ProfRoomTile";
import TravelsTile from "./TravelsTile";

export default function DashboardTile({ category, priority }: { category: Categories; priority?: boolean }) {
  switch (category.variant) {
    case "travels":
      return <TravelsTile category={category} priority={priority} />;
    case "prof-room":
      return <ProfRoomTile category={category} priority={priority} />;
    case "agent-ia":
      return <AgentIATile category={category} priority={priority} />;
    case "absences-calendar":
      return <AbsencesCalendarTile category={category} priority={priority} />;
    default:
      return (
        <Slide
          name={category.name}
          link={category.link}
          img={category.img}
          external={category.external}
          priority={priority}
        />
      );
  }
}
