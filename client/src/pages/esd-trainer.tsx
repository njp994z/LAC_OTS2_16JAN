import ExperiencePage from "@/components/ExperiencePage";
import { demoExperiences } from "@/config/demoExperiences";

export default function ESDTrainer() {
  const experience = demoExperiences.find(e => e.id === "esd-trainer")!;
  
  return (
    <ExperiencePage 
      title={experience.title}
      description={experience.description}
    />
  );
}
