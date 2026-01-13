import { useState, useEffect } from "react";
import { Settings as SettingsIcon, ArrowLeft, ExternalLink, Save, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTurboGenerator } from "@/delta-v/contexts/TurboGeneratorContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TurboGeneratorSettings = () => {
  const { config: sharedConfig, updateConfig, isSaving, isLoading } = useTurboGenerator();
  const [localConfig, setLocalConfig] = useState(sharedConfig);

  useEffect(() => {
    setLocalConfig(sharedConfig);
  }, [sharedConfig]);

  const handleChange = (field: string, value: string | boolean) => {
    setLocalConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyChanges = async () => {
    await updateConfig(localConfig);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
              <SettingsIcon className="text-primary" size={24} />
              <h1 className="text-2xl font-bold">Turbo Generator Settings</h1>
            </div>
          </div>
          <Button 
            onClick={handleApplyChanges} 
            disabled={isSaving}
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
                  value={localConfig.tagName}
                  onChange={(e) => handleChange("tagName", e.target.value)}
                  className="w-48 h-8 bg-slate-900 border-slate-600 text-slate-100 text-sm"
                />
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-slate-300 text-sm">Description</span>
                <Input
                  value={localConfig.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-48 h-8 bg-slate-900 border-slate-600 text-slate-100 text-sm"
                />
              </div>
              <div className="flex justify-between items-center px-4 py-3 bg-slate-800/50">
                <span className="text-slate-300 text-sm">Unit</span>
                <Input
                  value={localConfig.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                  className="w-48 h-8 bg-slate-900 border-slate-600 text-slate-100 text-sm"
                />
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-slate-300 text-sm">Engineering Units</span>
                <Select
                  value={localConfig.engineeringUnits}
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
                  checked={localConfig.transparentBackground}
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
                <span className="font-medium">{localConfig.tagName}</span>
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
        </div>
      </div>
    </div>
  );
};

export default TurboGeneratorSettings;
