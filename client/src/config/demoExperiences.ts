export interface DemoExperience {
  id: string;
  title: string;
  description: string;
  path: string;
  enabled: boolean;
}

export const demoExperiences: DemoExperience[] = [
  {
    id: "static-simulator",
    title: "Static Acid Plant Simulator",
    description: "Instantly generate precise heat and material balances using fixed inputs. Ideal for validating operator decisions and understanding steady-state plant performance.",
    path: "/simulator?scenario=1",
    enabled: true
  },
  {
    id: "dynamic-simulator",
    title: "Dynamic Acid Plant Simulator",
    description: "Experience real-time process dynamics, including control loop response times. Master how setpoint changes propagate through the system and stabilize operations.",
    path: "/dynamic-simulation",
    enabled: true
  },
  {
    id: "unit-operation-simulator",
    title: "Unit Operation Simulator",
    description: "Dive deep into individual unit operations with focused simulations. Perfect for understanding specific equipment behavior and optimizing performance at the component level.",
    path: "/unit-operation-simulator",
    enabled: true
  },
  {
    id: "profit-maximizer",
    title: "Monte Carlo: Profit Maximizer & Operation Optimizer",
    description: "Harness Monte Carlo simulations to run thousands of scenarios, pinpointing the exact parameters that unlock peak profitability. Delivers data-driven, meta-optimal operating setpoints.",
    path: "/profit-maximizer",
    enabled: true
  },
  {
    id: "esd-trainer",
    title: "Emergency Shutdown (ESD) Trainer",
    description: "High-fidelity interlock scenarios prepare operators to respond confidently during upsets and execute safe, rapid plant shutdowns.",
    path: "/esd-trainer",
    enabled: true
  }
];

export const otsResources: DemoExperience[] = [
  {
    id: "ots-learning-hub",
    title: "OTS Learning Hub",
    description: "Jump-start proficiency with bite-sized tutorials, walkthrough videos, and the complete OTS User Guide—everything needed to master the simulator.",
    path: "/ots-learning-hub",
    enabled: true
  },
  {
    id: "daily-operations",
    title: "Daily Operations Playbook",
    description: "Follow SOPs with crystal-clear step-by-step videos, annotated photos, and fillable digital logs to run the plant smoothly shift after shift.",
    path: "/daily-operations-playbook",
    enabled: true
  },
  {
    id: "maintenance-mastery",
    title: "Maintenance Mastery",
    description: "Extend asset life decades ahead using best-practice SOPs, video-guided procedures, and preventive checklists tailored for sulfuric acid plants.",
    path: "/maintenance-mastery",
    enabled: true
  },
  {
    id: "capital-projects",
    title: "Capital Projects Accelerator",
    description: "Equip teams to scope, execute, and commission replacement equipment and upgrades that keep the plant reliable and future-proof.",
    path: "/capital-projects-accelerator",
    enabled: true
  },
  {
    id: "safety-academy",
    title: "Safety First Academy",
    description: "Zero-incident training on hazard recognition, PPE protocols, emergency response, and safe work practices specific to sulfuric acid environments.",
    path: "/safety-first-academy",
    enabled: true
  },
  {
    id: "document-vault",
    title: "Acid Plant Document Vault",
    description: "One-click access to every plant engineering design specification, equipment drawing, SOP, datasheet, and OEM manual—centralized, searchable, and version-controlled for flawless operations.",
    path: "/acid-plant-document-vault",
    enabled: true
  },
  {
    id: "technology-deep-dive",
    title: "Sulfuric Acid Technology Deep Dive",
    description: "SME-level modules to unpack the thermodynamics, reaction kinetics, metallurgy, and process engineering behind world-class acid production.",
    path: "/sulfuric-acid-technology-deep-dive",
    enabled: true
  }
];
