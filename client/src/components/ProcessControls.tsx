import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";

export default function ProcessControls() {
  //todo: remove mock functionality
  const [temp, setTemp] = useState([420]);
  const [pressure, setPressure] = useState([115]);
  const [flowRate, setFlowRate] = useState([1250]);
  
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Process Controls</h3>
      </div>
      
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="temp-control" className="text-sm font-medium">
              Reactor Temperature
            </Label>
            <span className="text-sm font-mono text-foreground" data-testid="text-temp-value">
              {temp[0]}°C
            </span>
          </div>
          <Slider
            id="temp-control"
            min={350}
            max={500}
            step={5}
            value={temp}
            onValueChange={setTemp}
            data-testid="slider-temperature"
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>350°C</span>
            <span>500°C</span>
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="pressure-control" className="text-sm font-medium">
              System Pressure
            </Label>
            <span className="text-sm font-mono text-foreground" data-testid="text-pressure-value">
              {pressure[0]} psi
            </span>
          </div>
          <Slider
            id="pressure-control"
            min={80}
            max={150}
            step={1}
            value={pressure}
            onValueChange={setPressure}
            data-testid="slider-pressure"
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>80 psi</span>
            <span>150 psi</span>
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="flow-control" className="text-sm font-medium">
              Feed Flow Rate
            </Label>
            <span className="text-sm font-mono text-foreground" data-testid="text-flow-value">
              {flowRate[0]} kg/h
            </span>
          </div>
          <Slider
            id="flow-control"
            min={800}
            max={1600}
            step={10}
            value={flowRate}
            onValueChange={setFlowRate}
            data-testid="slider-flow"
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>800 kg/h</span>
            <span>1600 kg/h</span>
          </div>
        </div>
        
        <div className="pt-4 border-t border-border">
          <Label htmlFor="setpoint-input" className="text-sm font-medium mb-2 block">
            Custom Setpoint
          </Label>
          <div className="flex gap-2">
            <Input 
              id="setpoint-input"
              type="number" 
              placeholder="Enter value"
              data-testid="input-setpoint"
              className="font-mono"
            />
            <Button 
              variant="outline"
              data-testid="button-apply-setpoint"
              onClick={() => console.log('Setpoint applied')}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
