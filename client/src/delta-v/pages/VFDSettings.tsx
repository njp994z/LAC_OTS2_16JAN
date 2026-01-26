import { useState, useEffect } from "react";
import { Settings, ArrowLeft, ExternalLink, Save, Loader2, Check } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useCompressor } from "@/delta-v/contexts/CompressorContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const VFDSettings = () => {
  const { vfdConfig, setVFDConfigLocal, saveVFDConfig, isVFDConfigSaving, isVFDConfigLoading } = useCompressor();
  
  // Track the original saved config to detect changes
  const [savedConfig, setSavedConfig] = useState(vfdConfig);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update savedConfig when config changes from server (initial load or after save)
  useEffect(() => {
    if (!isVFDConfigLoading && !isVFDConfigSaving && !isSaving) {
      setSavedConfig(vfdConfig);
      setIsDirty(false);
    }
  }, [isVFDConfigLoading, isVFDConfigSaving, isSaving, vfdConfig]);

  // Check if config has changed from saved
  useEffect(() => {
    const hasChanges = 
      vfdConfig.tagName !== savedConfig.tagName ||
      vfdConfig.description !== savedConfig.description ||
      vfdConfig.unit !== savedConfig.unit ||
      vfdConfig.engineeringUnits !== savedConfig.engineeringUnits ||
      vfdConfig.transparentBackground !== savedConfig.transparentBackground;
    setIsDirty(hasChanges);
  }, [vfdConfig, savedConfig]);

  const handleChange = (field: string, value: string | boolean) => {
    setVFDConfigLocal({ [field]: value });
  };

  const handleApplyChanges = async () => {
    setIsSaving(true);
    try {
      await saveVFDConfig();
      // savedConfig will be updated by the effect after mutation completes
    } catch (error) {
      // Error is handled by the mutation's onError in context
    } finally {
      setIsSaving(false);
    }
  };

  if (isVFDConfigLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link 
              to="/settings/controller-outputs/faceplates/compressor-faceplate" 
              className="p-2 rounded-lg bg-card hover:bg-muted border border-border transition-colors"
              data-testid="link-back-to-compressor"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <Settings className="text-primary" size={24} />
              <h1 className="text-2xl font-bold">VFD Settings</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isVFDConfigSaving && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            )}
            {isDirty && !isVFDConfigSaving && (
              <Button
                onClick={handleApplyChanges}
                className="bg-cyan-600 text-white"
                data-testid="button-apply-changes"
              >
                <Check className="h-4 w-4 mr-2" />
                Apply Changes
              </Button>
            )}
          </div>
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
                  value={vfdConfig.tagName}
                  onChange={(e) => handleChange("tagName", e.target.value)}
                  className="w-48 h-8 bg-slate-900 border-slate-600 text-slate-100 text-sm"
                  data-testid="input-vfd-tag-name"
                />
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-slate-300 text-sm">Description</span>
                <Input
                  value={vfdConfig.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-48 h-8 bg-slate-900 border-slate-600 text-slate-100 text-sm"
                  data-testid="input-vfd-description"
                />
              </div>
              <div className="flex justify-between items-center px-4 py-3 bg-slate-800/50">
                <span className="text-slate-300 text-sm">Unit</span>
                <Input
                  value={vfdConfig.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                  className="w-48 h-8 bg-slate-900 border-slate-600 text-slate-100 text-sm"
                  data-testid="input-vfd-unit"
                />
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-slate-300 text-sm">Engineering Units</span>
                <Select
                  value={vfdConfig.engineeringUnits}
                  onValueChange={(value) => handleChange("engineeringUnits", value)}
                >
                  <SelectTrigger className="w-48 h-8 bg-slate-900 border-slate-600 text-slate-100 text-sm" data-testid="select-vfd-engineering-units">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="Hz" className="text-slate-100">Hz</SelectItem>
                    <SelectItem value="%" className="text-slate-100">%</SelectItem>
                    <SelectItem value="RPM" className="text-slate-100">RPM</SelectItem>
                    <SelectItem value="kW" className="text-slate-100">kW</SelectItem>
                    <SelectItem value="°C" className="text-slate-100">°C</SelectItem>
                    <SelectItem value="°F" className="text-slate-100">°F</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between items-center px-4 py-3 bg-slate-800/50">
                <span className="text-slate-300 text-sm">Transparent Background</span>
                <Switch
                  checked={vfdConfig.transparentBackground}
                  onCheckedChange={(checked) => handleChange("transparentBackground", checked)}
                  className="data-[state=checked]:bg-cyan-500"
                  data-testid="switch-vfd-transparent-bg"
                />
              </div>
            </div>
          </div>

          {/* VFD Motor Control Faceplates Panel */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
              <h2 className="text-cyan-400 font-bold text-sm">VFD MOTOR CONTROL FACEPLATES</h2>
            </div>
            <div className="divide-y divide-slate-700">
              <Link 
                to="/settings/controller-outputs/faceplates/compressor-faceplate" 
                className="flex justify-between items-center px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                data-testid="link-primary-vfd-panel"
              >
                <span className="text-slate-300 text-sm">Primary VFD Control Panel</span>
                <ExternalLink className="text-cyan-400" size={16} />
              </Link>
              <Link 
                to="/settings/controller-outputs/faceplates/vfd-compare" 
                className="flex justify-between items-center px-4 py-3 hover:bg-slate-700/50 transition-colors"
                data-testid="link-vfd-compare"
              >
                <span className="text-slate-300 text-sm">VFD Compare (Primary & Backup)</span>
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
                <span className="font-medium">{vfdConfig.tagName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Max Speed</span>
                <span className="font-medium">100%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Min Speed</span>
                <span className="font-medium">0%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Rated Power</span>
                <span className="font-medium">150 kW</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Control Parameters</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Acceleration Time</span>
                <span className="font-medium">10 sec</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Deceleration Time</span>
                <span className="font-medium">15 sec</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Control Mode</span>
                <span className="font-medium">Speed Control</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VFDSettings;
