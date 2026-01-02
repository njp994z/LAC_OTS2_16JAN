import ExperiencePage from "@/components/ExperiencePage";
import { otsResources } from "@/config/demoExperiences";

export default function SulfuricAcidTechnologyDeepDive() {
  const experience = otsResources.find(e => e.id === "technology-deep-dive")!;
  
  return (
    <ExperiencePage 
      title={experience.title}
      description={experience.description}
    />
  );
}
