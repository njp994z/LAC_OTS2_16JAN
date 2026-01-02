import ExperiencePage from "@/components/ExperiencePage";
import { otsResources } from "@/config/demoExperiences";

export default function DailyOperationsPlaybook() {
  const experience = otsResources.find(e => e.id === "daily-operations")!;
  
  return (
    <ExperiencePage 
      title={experience.title}
      description={experience.description}
    />
  );
}
