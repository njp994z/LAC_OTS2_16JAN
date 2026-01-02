import ExperiencePage from "@/components/ExperiencePage";
import { otsResources } from "@/config/demoExperiences";

export default function AcidPlantDocumentVault() {
  const experience = otsResources.find(e => e.id === "document-vault")!;
  
  return (
    <ExperiencePage 
      title={experience.title}
      description={experience.description}
    />
  );
}
