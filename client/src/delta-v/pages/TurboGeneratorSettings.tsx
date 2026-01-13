import { useState } from "react";
import { Settings, ArrowLeft, ExternalLink, Save, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TurboGeneratorSettings = () => {
  const [config, setConfig] = useState({
    tagName: "1560-TG-001",
    description: "Turbo Generator Set",
    unit: "U-1560",
    engineeringUnits: "MW",
    transparentBackground: false,
  });
  const [isLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleChange = (field: string, value: string | boolean) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyChanges = async () => {
    setIsSaving(true);
    setTimeout(() => {
      toast({ title: "Success", description: "Settings saved successfully" });
      setIsSaving(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link 
              to="/settings/controller-outputs/faceplates/turbo-generator-faceplate" 
              className="p-2 rounded-lg bg-card hover:bg-muted border border-border transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <Settings className="text-primary" size={24} />
              <h1 className="text-2xl font-bold">Turbo Generator Settings</h1>
            </div>
          </div>
          <Button 
            onClick={handleApplyChanges} 
            disabled={isSaving || isLoading}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Apply Changes
              </>
            )}
          </Button>
        </div>

        <div className="grid gap-4">
          {/* Identification & Configuration Panel */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
              <h2 className="text-cyan-400 font-bold text-sm">IDENTIFICATION & CONFIGURATION</h2>
            </div>
            <div className="divide-y divide-slate-700">
              <div className="flex justify-between items-center px-4 py-3 bg-slate-800/50">
                <span className="text-slate-300 text-sm">Tag Name</span>
                <Input
                  value={config.tagName}
                  onChange={(e) => handleChange("tagName", e.target.value)}
                  className="w-48 h-8 bg-slate-900 border-slate-600 text-slate-100 text-sm"
                />
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-slate-300 text-sm">Description</span>
                <Input
                  value={config.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-48 h-8 bg-slate-900 border-slate-600 text-slate-100 text-sm"
                />
              </div>
              <div className="flex justify-between items-center px-4 py-3 bg-slate-800/50">
                <span className="text-slate-300 text-sm">Unit</span>
                <Input
                  value={config.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                  className="w-48 h-8 bg-slate-900 border-slate-600 text-slate-100 text-sm"
                />
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-slate-300 text-sm">Engineering Units</span>
                <Select
                  value={config.engineeringUnits}
                  onValueChange={(value) => handleChange("engineeringUnits", value)}
                >
                  <SelectTrigger className="w-48 h-8 bg-slate-900 border-slate-600 text-slate-100 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="MW" className="text-slate-100">MW</SelectItem>
                    <SelectItem value="kW" className="text-slate-100">kW</SelectItem>
                    <SelectItem value="Hz" className="text-slate-100">Hz</SelectItem>
                    <SelectItem value="%" className="text-slate-100">%</SelectItem>
                    <SelectItem value="RPM" className="text-slate-100">RPM</SelectItem>
                    <SelectItem value="°C" className="text-slate-100">°C</SelectItem>
                    <SelectItem value="°F" className="text-slate-100">°F</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between items-center px-4 py-3 bg-slate-800/50">
                <span className="text-slate-300 text-sm">Transparent Background</span>
                <Switch
                  checked={config.transparentBackground}
                  onCheckedChange={(checked) => handleChange("transparentBackground", checked)}
                  className="data-[state=checked]:bg-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Turbo Generator Control Faceplates Panel */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
              <h2 className="text-cyan-400 font-bold text-sm">TURBO GENERATOR CONTROL FACEPLATES</h2>
            </div>
            <div className="divide-y divide-slate-700">
              <Link 
                to="/settings/controller-outputs/faceplates/turbo-generator-faceplate" 
                className="flex justify-between items-center px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
              >
                <span className="text-slate-300 text-sm">Primary Turbo Generator Control Panel</span>
                <ExternalLink className="text-cyan-400" size={16} />
              </Link>
              <Link 
                to="/settings/controller-outputs/faceplates/turbo-generator-compare" 
                className="flex justify-between items-center px-4 py-3 hover:bg-slate-700/50 transition-colors"
              >
                <span className="text-slate-300 text-sm">Turbo Generator Compare (Primary & Backup)</span>
                <ExternalLink className="text-cyan-400" size={16} />
              </Link>
            </div>
          </div>

          {/* General Configuration Panel */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">General Configuration</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Device Name</span>
                <span className="font-medium">{config.tagName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Max Power Output</span>
                <span className="font-medium">50 MW</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Min Power Output</span>
                <span className="font-medium">0 MW</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Rated Speed</span>
                <span className="font-medium">3600 RPM</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Control Parameters</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Ramp Up Time</span>
                <span className="font-medium">30 sec</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Ramp Down Time</span>
                <span className="font-medium">45 sec</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Control Mode</span>
                <span className="font-medium">Power Control</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurboGeneratorSettings;
