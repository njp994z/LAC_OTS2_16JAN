import ExperiencePage from "@/components/ExperiencePage";
import { otsResources } from "@/config/demoExperiences";

export default function CapitalProjectsAccelerator() {
  const experience = otsResources.find(e => e.id === "capital-projects")!;
  
  return (
    <ExperiencePage 
      title={experience.title}
      description={experience.description}
    />
  );
}
