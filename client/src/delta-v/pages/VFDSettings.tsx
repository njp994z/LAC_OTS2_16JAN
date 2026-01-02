import { useState, useEffect } from "react";
import { Settings, ArrowLeft, ExternalLink, Save, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const VFDSettings = () => {
  const [config, setConfig] = useState({
    tagName: "VFD-001",
    description: "Variable Frequency Drive",
    unit: "U-505",
    engineeringUnits: "Hz",
    transparentBackground: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleChange = (field: string, value: string | boolean) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('vfd_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setConfig({
          tagName: data.tag_name,
          description: data.description || '',
          unit: data.unit || '',
          engineeringUnits: data.engineering_units || 'Hz',
          transparentBackground: data.transparent_background || false,
        });
        setSettingsId(data.id);
      }
      setIsLoading(false);
    };

    fetchSettings();
  }, []);

  const handleApplyChanges = async () => {
    setIsSaving(true);
    
    const settingsData = {
      tag_name: config.tagName,
      description: config.description,
      unit: config.unit,
      engineering_units: config.engineeringUnits,
      transparent_background: config.transparentBackground,
      updated_at: new Date().toISOString(),
    };
    
    let result;
    if (settingsId) {
      result = await supabase
        .from('vfd_settings')
        .update(settingsData)
        .eq('id', settingsId);
    } else {
      result = await supabase
        .from('vfd_settings')
        .insert(settingsData)
        .select()
        .single();
      
      if (result.data) {
        setSettingsId(result.data.id);
      }
    }
    
    if (result.error) {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Settings saved successfully" });
    }
    
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link 
              to="/compressor-faceplate" 
              className="p-2 rounded-lg bg-card hover:bg-muted border border-border transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <Settings className="text-primary" size={24} />
              <h1 className="text-2xl font-bold">VFD Settings</h1>
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
                  checked={config.transparentBackground}
                  onCheckedChange={(checked) => handleChange("transparentBackground", checked)}
                  className="data-[state=checked]:bg-cyan-500"
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
                to="/compressor-faceplate" 
                className="flex justify-between items-center px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
              >
                <span className="text-slate-300 text-sm">Primary VFD Control Panel</span>
                <ExternalLink className="text-cyan-400" size={16} />
              </Link>
              <Link 
                to="/vfd-compare" 
                className="flex justify-between items-center px-4 py-3 hover:bg-slate-700/50 transition-colors"
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
                <span className="font-medium">{config.tagName}</span>
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
