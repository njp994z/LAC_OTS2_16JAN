import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, PlayCircle, GraduationCap, ClipboardList, Wrench, Building2, ShieldCheck, FolderArchive, FlaskConical, FolderOpen } from "lucide-react";

interface OTSResource {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const otsResources: OTSResource[] = [
  {
    id: "ots-learning-hub",
    title: "OTS Learning Hub",
    description: "Jump-start proficiency with bite-sized tutorials, walkthrough videos, and the complete OTS User Guide—everything needed to master the simulator.",
    path: "/ots-learning-hub",
    icon: GraduationCap
  },
  {
    id: "daily-operations",
    title: "Daily Operations Playbook",
    description: "Follow SOPs with crystal-clear step-by-step videos, annotated photos, and fillable digital logs to run the plant smoothly shift after shift.",
    path: "/daily-operations-playbook",
    icon: ClipboardList
  },
  {
    id: "maintenance-mastery",
    title: "Maintenance Mastery",
    description: "Extend asset life decades ahead using best-practice SOPs, video-guided procedures, and preventive checklists tailored for sulfuric acid plants.",
    path: "/maintenance-mastery",
    icon: Wrench
  },
  {
    id: "capital-projects",
    title: "Capital Projects Accelerator",
    description: "Equip teams to scope, execute, and commission replacement equipment and upgrades that keep the plant reliable and future-proof.",
    path: "/capital-projects-accelerator",
    icon: Building2
  },
  {
    id: "safety-academy",
    title: "Safety First Academy",
    description: "Zero-incident training on hazard recognition, PPE protocols, emergency response, and safe work practices specific to sulfuric acid environments.",
    path: "/safety-first-academy",
    icon: ShieldCheck
  },
  {
    id: "document-vault",
    title: "Acid Plant Document Vault",
    description: "One-click access to every plant engineering design specification, equipment drawing, SOP, datasheet, and OEM manual—centralized, searchable, and version-controlled for flawless operations.",
    path: "/acid-plant-document-vault",
    icon: FolderArchive
  },
  {
    id: "technology-deep-dive",
    title: "Sulfuric Acid Technology Deep Dive",
    description: "SME-level modules to unpack the thermodynamics, reaction kinetics, metallurgy, and process engineering behind world-class acid production.",
    path: "/sulfuric-acid-technology-deep-dive",
    icon: FlaskConical
  }
];

export default function OTSInstructionsVideos() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/settings/controller-outputs/faceplates/home-screen")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <PlayCircle className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">OTS Instructions & Videos</h1>
                <p className="text-xs text-muted-foreground">Training materials and comprehensive documentation</p>
              </div>
            </div>
          </div>
          <Button
            variant="default"
            onClick={() => setLocation("/settings/plant-document-library")}
            data-testid="button-plant-document-library"
            className="gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            Plant Document Library
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Training Resources</CardTitle>
              <CardDescription>
                Select a resource to access training materials and documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {otsResources.map((resource) => (
                  <Button
                    key={resource.id}
                    variant="default"
                    className="h-auto py-4 px-5 justify-start text-left"
                    onClick={() => setLocation(resource.path)}
                    data-testid={`button-${resource.id}`}
                  >
                    <resource.icon className="w-5 h-5 mr-4 flex-shrink-0" />
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{resource.title}</span>
                      <span className="text-xs opacity-80 font-normal whitespace-normal">
                        {resource.description}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>OTS Instructions & Videos | Training Resources</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
