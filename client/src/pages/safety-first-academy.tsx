import ExperiencePage from "@/components/ExperiencePage";
import { otsResources } from "@/config/demoExperiences";

export default function SafetyFirstAcademy() {
  const experience = otsResources.find(e => e.id === "safety-academy")!;
  
  return (
    <ExperiencePage 
      title={experience.title}
      description={experience.description}
    />
  );
}
