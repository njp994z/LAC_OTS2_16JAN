import ExperiencePage from "@/components/ExperiencePage";
import { otsResources } from "@/config/demoExperiences";

export default function MaintenanceMastery() {
  const experience = otsResources.find(e => e.id === "maintenance-mastery")!;
  
  return (
    <ExperiencePage 
      title={experience.title}
      description={experience.description}
    />
  );
}
