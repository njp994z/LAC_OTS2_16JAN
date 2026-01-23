import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, LogIn, BarChart3, Move, Lock, Unlock, Pencil, Check, X } from "lucide-react";
import { operatorScreens, ScreenId, InputControlConfig } from "@/lib/screenConfig";
import { PidFaceplate, FaceplateButton } from "@/components/PidFaceplate";
import expLogo from "@/assets/exp-logo.png";

interface DragPosition {
  x: number;
  y: number;
}

interface DraggableOverlayProps {
  id: string;
  initialPosition: { top?: string; left?: string; right?: string; bottom?: string };
  customPosition: DragPosition | undefined;
  onDragEnd: (id: string, position: DragPosition) => void;
  isLocked: boolean;
  isEditMode: boolean;
  scale: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

function DraggableOverlay({ id, initialPosition, customPosition, onDragEnd, isLocked, isEditMode, scale, children, className, style }: DraggableOverlayProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState<DragPosition | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isLocked || !elementRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    
    const rect = elementRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  }, [isLocked]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!elementRef.current?.parentElement) return;
      
      const parentRect = elementRef.current.parentElement.getBoundingClientRect();
      const newX = e.clientX - parentRect.left - dragOffset.x;
      const newY = e.clientY - parentRect.top - dragOffset.y;
      
      setCurrentPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (currentPos) {
        onDragEnd(id, currentPos);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, currentPos, id, onDragEnd]);

  const getPositionStyle = (): React.CSSProperties => {
    if (currentPos && isDragging) {
      return { left: currentPos.x, top: currentPos.y };
    }
    if (customPosition) {
      return { left: customPosition.x, top: customPosition.y };
    }
    return initialPosition as React.CSSProperties;
  };

  return (
    <div
      ref={elementRef}
      className={`${className} ${isDragging ? 'cursor-grabbing z-50' : ''} ${isEditMode ? 'ring-2 ring-yellow-500 ring-offset-1' : ''}`}
      style={{
        ...style,
        ...getPositionStyle(),
        position: 'absolute',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      {!isLocked && (
        <div 
          className="absolute -top-2 -left-2 w-5 h-5 bg-primary/80 hover:bg-primary rounded-full flex items-center justify-center cursor-grab z-10 opacity-60 hover:opacity-100 transition-opacity"
          onMouseDown={handleMouseDown}
          title="Drag to reposition"
        >
          <Move className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
      {children}
    </div>
  );
}

export default function StaticSimulation() {
  const [, setLocation] = useLocation();
  
  // Screen selection state
  const [selectedScreenId, setSelectedScreenId] = useState<ScreenId>('compressor');
  const selectedScreen = operatorScreens[selectedScreenId];
  
  // Inputs state per screen
  const [inputsByScreen, setInputsByScreen] = useState<Record<ScreenId, any>>({
    compressor: operatorScreens.compressor.defaultInputs,
    'l2-sulfur-burner': operatorScreens['l2-sulfur-burner'].defaultInputs,
    converter: operatorScreens.converter.defaultInputs,
  });
  
  // Outputs state per screen
  const [outputsByScreen, setOutputsByScreen] = useState<Record<ScreenId, any>>({
    compressor: null,
    'l2-sulfur-burner': null,
    converter: null,
  });

  // Mode state per control (keyed by control id)
  const [controlModes, setControlModes] = useState<Record<string, "AUTO" | "MAN">>({});
  
  // Manual output state per control (keyed by control id)
  const [manualOutputs, setManualOutputs] = useState<Record<string, number>>({});

  // Custom positions for draggable overlays (keyed by element id)
  const [customPositions, setCustomPositions] = useState<Record<string, DragPosition>>({});
  
  // Lock state - when true, overlays cannot be dragged
  const [isLocked, setIsLocked] = useState(false);
  
  // Edit mode state - for editing overlay text
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);
  
  // Custom labels for overlays (overrides default labels)
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});
  const [editLabelValue, setEditLabelValue] = useState("");
  
  // Custom font sizes for output values (in pixels)
  const [customFontSizes, setCustomFontSizes] = useState<Record<string, number>>({});
  const [editFontSize, setEditFontSize] = useState<number>(14);
  
  // Image container ref and scale tracking
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [overlayScale, setOverlayScale] = useState(1);
  const BASE_WIDTH = 1200; // Reference width for scale=1
  
  // Track image container size and update scale
  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;
    
    const updateScale = () => {
      const width = container.offsetWidth;
      const newScale = Math.max(0.5, Math.min(1.5, width / BASE_WIDTH));
      setOverlayScale(newScale);
    };
    
    // Initial calculation
    updateScale();
    
    // Use ResizeObserver to track size changes
    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(container);
    
    return () => resizeObserver.disconnect();
  }, []);

  const handleDragEnd = useCallback((id: string, position: DragPosition) => {
    setCustomPositions(prev => ({
      ...prev,
      [id]: position
    }));
  }, []);
  
  const handleStartEdit = (id: string, currentLabel: string) => {
    setEditingOverlayId(id);
    setEditLabelValue(currentLabel);
    setEditFontSize(customFontSizes[id] || 14);
  };
  
  const handleSaveLabel = () => {
    if (editingOverlayId) {
      setCustomLabels(prev => ({
        ...prev,
        [editingOverlayId]: editLabelValue
      }));
      setCustomFontSizes(prev => ({
        ...prev,
        [editingOverlayId]: editFontSize
      }));
      setEditingOverlayId(null);
      setEditLabelValue("");
      setEditFontSize(14);
    }
  };
  
  const handleCancelEdit = () => {
    setEditingOverlayId(null);
    setEditLabelValue("");
    setEditFontSize(14);
  };
  
  const getLabel = (id: string, defaultLabel: string): string => {
    return customLabels[id] || defaultLabel;
  };
  
  const getFontSize = (id: string, defaultSize: number = 14): number => {
    return customFontSizes[id] || defaultSize;
  };

  const currentInputs = inputsByScreen[selectedScreenId];
  const currentOutputs = outputsByScreen[selectedScreenId];

  // Run simulation when inputs change
  useEffect(() => {
    const results = selectedScreen.runSimulation(currentInputs);
    setOutputsByScreen(prev => ({
      ...prev,
      [selectedScreenId]: results,
    }));
  }, [currentInputs, selectedScreenId, selectedScreen]);

  const formatNumber = (value: number, decimals: number = 1): string => {
    return value.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  const handleInputChange = (stateKey: string, value: number) => {
    setInputsByScreen(prev => ({
      ...prev,
      [selectedScreenId]: {
        ...prev[selectedScreenId],
        [stateKey]: value,
      },
    }));
  };

  const handleScreenChange = (screenId: string) => {
    setSelectedScreenId(screenId as ScreenId);
  };

  const handleModeChange = (controlId: string, mode: "AUTO" | "MAN") => {
    setControlModes(prev => ({
      ...prev,
      [controlId]: mode,
    }));
  };

  const handleManualOutputChange = (controlId: string, value: number) => {
    setManualOutputs(prev => ({
      ...prev,
      [controlId]: value,
    }));
  };

  const getControlMode = (controlId: string): "AUTO" | "MAN" => {
    return controlModes[controlId] || "AUTO";
  };

  const getManualOutput = (controlId: string, defaultValue: number): number => {
    return manualOutputs[controlId] ?? defaultValue;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/demo")}
              data-testid="button-back-to-demo"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <img src={expLogo} alt="EXP Logo" className="h-6 object-contain" data-testid="img-exp-logo-header" />
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground hover:underline cursor-pointer">Lithium Americas</span>
            </Link>
          </div>
          <Button 
            onClick={() => setLocation("/login")}
            data-testid="button-login-header"
            className="gap-2"
          >
            <LogIn className="w-4 h-4" />
            Login
          </Button>
        </div>
      </header>
      <main className="pt-20 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-semibold text-foreground mb-2" data-testid="text-page-title">
              Static Simulation Demo
            </h1>
            <p className="text-lg text-muted-foreground" data-testid="text-page-subtitle">
              Sulfur Burning Process - Interactive Heat and Material Balance
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <CardTitle>{selectedScreen.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border border-border rounded-md p-1">
                      <Button
                        variant={isLocked ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setIsLocked(!isLocked)}
                        data-testid="button-toggle-lock"
                        className="gap-1"
                        title={isLocked ? "Unlock overlays for dragging" : "Lock overlays in place"}
                      >
                        {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        {isLocked ? "Locked" : "Unlocked"}
                      </Button>
                      <Button
                        variant={isEditMode ? "default" : "ghost"}
                        size="sm"
                        onClick={() => {
                          setIsEditMode(!isEditMode);
                          if (isEditMode) {
                            setEditingOverlayId(null);
                            setEditLabelValue("");
                          }
                        }}
                        data-testid="button-toggle-edit"
                        className="gap-1"
                        title={isEditMode ? "Exit edit mode" : "Edit overlay labels"}
                      >
                        <Pencil className="w-4 h-4" />
                        {isEditMode ? "Editing" : "Edit Labels"}
                      </Button>
                    </div>
                    <Select value={selectedScreenId} onValueChange={handleScreenChange}>
                      <SelectTrigger className="w-[300px]" data-testid="select-screen">
                        <SelectValue placeholder="Select screen" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(operatorScreens).map(screen => (
                          <SelectItem key={screen.id} value={screen.id} data-testid={`select-option-${screen.id}`}>
                            {screen.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div ref={imageContainerRef} className="relative w-full">
                  <img 
                    src={selectedScreen.image} 
                    alt={selectedScreen.imageAlt}
                    className="w-full h-auto pl-[10px] pr-[10px]"
                    data-testid="img-process-diagram"
                  />
                  
                  {/* Render input control overlays */}
                  {selectedScreen.inputControls.map(control => {
                    const value = currentInputs[control.stateKey];
                    
                    if (control.controlType === 'faceplate' && control.faceplateConfig) {
                      const pvValue = currentOutputs?.[control.faceplateConfig.pvKey || ''] || value;
                      const autoOutputValue = currentOutputs?.[control.faceplateConfig.outputKey || ''] || 0;
                      const autoOutputPercent = (autoOutputValue / 10) * 100;
                      const controlMode = getControlMode(control.id);
                      const outputPercent = controlMode === "MAN" 
                        ? getManualOutput(control.id, autoOutputPercent) 
                        : autoOutputPercent;
                      
                      const controlOverlayId = `control-${control.id}`;
                      return (
                        <DraggableOverlay
                          key={control.id}
                          id={controlOverlayId}
                          initialPosition={control.position}
                          customPosition={customPositions[controlOverlayId]}
                          onDragEnd={handleDragEnd}
                          isLocked={isLocked}
                          isEditMode={isEditMode && editingOverlayId === controlOverlayId}
                          scale={overlayScale}
                          className="z-10"
                        >
                          {isEditMode && control.faceplateConfig && (
                            <div 
                              className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-500 hover:bg-yellow-600 rounded-full flex items-center justify-center cursor-pointer z-20"
                              onClick={() => handleStartEdit(controlOverlayId, control.faceplateConfig!.tagName)}
                              title="Edit label"
                            >
                              <Pencil className="w-3 h-3 text-white" />
                            </div>
                          )}
                          {editingOverlayId === controlOverlayId ? (
                            <div className="bg-background border border-border rounded-md p-2 shadow-lg min-w-[150px]">
                              <Input
                                value={editLabelValue}
                                onChange={(e) => setEditLabelValue(e.target.value)}
                                className="h-7 text-xs mb-2"
                                autoFocus
                              />
                              <div className="flex gap-1">
                                <Button size="sm" onClick={handleSaveLabel} className="h-6 text-xs">
                                  <Check className="w-3 h-3 mr-1" /> Save
                                </Button>
                                <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-6 text-xs">
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <PidFaceplate
                              title={control.label}
                              tagName={getLabel(controlOverlayId, control.faceplateConfig.tagName)}
                              subtitle={control.faceplateConfig.subtitle}
                              processVariable={pvValue}
                              setpoint={value}
                              output={outputPercent}
                              pvUnit={control.unit || "RPM"}
                              pvMin={control.min}
                              pvMax={control.max}
                              mode={controlMode}
                              onSetpointChange={(newValue) => handleInputChange(control.stateKey, newValue)}
                              onModeChange={(mode) => handleModeChange(control.id, mode)}
                              onOutputChange={(newOutput) => handleManualOutputChange(control.id, newOutput)}
                            >
                              <FaceplateButton
                                tagName={getLabel(controlOverlayId, control.faceplateConfig.tagName)}
                                value={value}
                                unit={control.unit || "RPM"}
                                testId={control.testId}
                              />
                            </PidFaceplate>
                          )}
                        </DraggableOverlay>
                      );
                    }
                    
                    const sliderOverlayId = `control-${control.id}`;
                    return (
                      <DraggableOverlay
                        key={control.id}
                        id={sliderOverlayId}
                        initialPosition={control.position}
                        customPosition={customPositions[sliderOverlayId]}
                        onDragEnd={handleDragEnd}
                        isLocked={isLocked}
                        isEditMode={isEditMode && editingOverlayId === sliderOverlayId}
                        scale={overlayScale}
                        className="z-10 bg-background/95 backdrop-blur border border-border rounded-md p-2 shadow-lg"
                        style={{ width: control.width }}
                      >
                        {isEditMode && (
                          <div 
                            className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-500 hover:bg-yellow-600 rounded-full flex items-center justify-center cursor-pointer z-20"
                            onClick={() => handleStartEdit(sliderOverlayId, control.label)}
                            title="Edit label"
                          >
                            <Pencil className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {editingOverlayId === sliderOverlayId ? (
                          <div className="space-y-2">
                            <Input
                              value={editLabelValue}
                              onChange={(e) => setEditLabelValue(e.target.value)}
                              className="h-7 text-xs"
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <Button size="sm" onClick={handleSaveLabel} className="h-6 text-xs">
                                <Check className="w-3 h-3 mr-1" /> Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-6 text-xs">
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <Label htmlFor={control.id} className="text-[10px] font-semibold">
                              {getLabel(sliderOverlayId, control.label)}: {formatNumber(value, control.decimals)}{control.unit ? ` ${control.unit}` : ''}
                            </Label>
                            <Slider
                              id={control.id}
                              data-testid={control.testId}
                              min={control.min}
                              max={control.max}
                              step={control.step}
                              value={[value]}
                              onValueChange={([newValue]) => handleInputChange(control.stateKey, newValue)}
                            />
                            <Input
                              type="number"
                              data-testid={`input-${control.id}`}
                              value={value}
                              onChange={(e) => handleInputChange(control.stateKey, parseFloat(e.target.value) || 0)}
                              className="h-7 text-[10px]"
                            />
                          </div>
                        )}
                      </DraggableOverlay>
                    );
                  })}

                  {/* Render output overlays */}
                  {currentOutputs && selectedScreen.overlays.map(overlay => {
                    const outputOverlayId = `overlay-${overlay.id}`;
                    return (
                      <DraggableOverlay
                        key={overlay.id}
                        id={outputOverlayId}
                        initialPosition={overlay.position}
                        customPosition={customPositions[outputOverlayId]}
                        onDragEnd={handleDragEnd}
                        isLocked={isLocked}
                        isEditMode={isEditMode && editingOverlayId === outputOverlayId}
                        scale={overlayScale}
                        className="z-10 bg-background/95 backdrop-blur border border-border rounded-md p-2 shadow-lg"
                        style={{ width: overlay.width }}
                      >
                        {isEditMode && (
                          <div 
                            className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-500 hover:bg-yellow-600 rounded-full flex items-center justify-center cursor-pointer z-20"
                            onClick={() => handleStartEdit(outputOverlayId, overlay.label)}
                            title="Edit label"
                          >
                            <Pencil className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {editingOverlayId === outputOverlayId ? (
                          <div className="space-y-2 min-w-[160px]">
                            <div>
                              <Label className="text-[10px] text-muted-foreground">Label</Label>
                              <Input
                                value={editLabelValue}
                                onChange={(e) => setEditLabelValue(e.target.value)}
                                className="h-7 text-xs"
                                autoFocus
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] text-muted-foreground">Value Font Size (px)</Label>
                              <div className="flex items-center gap-2">
                                <Slider
                                  min={10}
                                  max={32}
                                  step={1}
                                  value={[editFontSize]}
                                  onValueChange={([val]) => setEditFontSize(val)}
                                  className="flex-1"
                                />
                                <span className="text-xs w-8 text-center">{editFontSize}</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" onClick={handleSaveLabel} className="h-6 text-xs">
                                <Check className="w-3 h-3 mr-1" /> Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-6 text-xs">
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-muted-foreground">{getLabel(outputOverlayId, overlay.label)}</p>
                            <p 
                              className="font-semibold" 
                              style={{ fontSize: `${getFontSize(outputOverlayId, 14)}px` }}
                              data-testid={overlay.testId}
                            >
                              {overlay.getValue(currentOutputs)}
                            </p>
                          </div>
                        )}
                      </DraggableOverlay>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {currentOutputs && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Calculated Outputs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={selectedScreen.outputSections[0].value} className="w-full">
                    <TabsList className={`grid w-full grid-cols-${selectedScreen.outputSections.length}`}>
                      {selectedScreen.outputSections.map(section => (
                        <TabsTrigger key={section.value} value={section.value} data-testid={section.testId}>
                          {section.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {selectedScreen.outputSections.map(section => (
                      <TabsContent key={section.value} value={section.value} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {section.fields.map(field => (
                            <div key={field.testId} className="space-y-1">
                              <p className="text-sm text-muted-foreground">{field.label}</p>
                              <p className="text-lg font-semibold" data-testid={field.testId}>
                                {field.getValue(currentOutputs)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            )}

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                This static simulation creates fixed outputs based on static inputs and recreates 
                the plant's heat and material balance per each set of operator inputs.
              </p>
              <Button
                onClick={() => setLocation("/login")}
                data-testid="button-login-to-interact"
                className="gap-2"
              >
                <LogIn className="w-4 h-4" />
                Login to Access Full Dynamic Simulator
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
