import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Settings, Droplets, ExternalLink } from "lucide-react";
import type { PsychrometricData } from "@shared/schema";

const toInHg = (hPa: number) => hPa * 0.02953;

export default function ConverterSettings() {
  const [, setLocation] = useLocation();
  
  const [converterDiameter, setConverterDiameter] = useState("42.0");

  // Fetch current psychrometric data for ambient pressure
  const psychrometricQuery = useQuery<PsychrometricData>({
    queryKey: ['/api/psychrometrics/current', '89445', 'US'],
    queryFn: async () => {
      const res = await fetch('/api/psychrometrics/current?zipCode=89445&countryCode=US');
      if (!res.ok) throw new Error('Failed to fetch psychrometric data');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  
  const [pass1Type1, setPass1Type1] = useState("MECS GR330");
  const [pass1Liters1, setPass1Liters1] = useState("97,700");
  const [pass1Activity1, setPass1Activity1] = useState("100.00");
  const [pass1Type2, setPass1Type2] = useState("");
  const [pass1Liters2, setPass1Liters2] = useState("XXXX");
  const [pass1Activity2, setPass1Activity2] = useState("X.XX");
  
  const [pass2Type1, setPass2Type1] = useState("MECS Super Gear XLP-310");
  const [pass2Liters1, setPass2Liters1] = useState("99,200");
  const [pass2Activity1, setPass2Activity1] = useState("100.00");
  
  const [pass3Type1, setPass3Type1] = useState("MECS Super Gear XLP-310");
  const [pass3Liters1, setPass3Liters1] = useState("143,000");
  const [pass3Activity1, setPass3Activity1] = useState("100.00");
  
  const [pass4Type1, setPass4Type1] = useState("MECS Super Gear XLP-310");
  const [pass4Liters1, setPass4Liters1] = useState("150,000");
  const [pass4Activity1, setPass4Activity1] = useState("100.00");
  const [pass4Type2, setPass4Type2] = useState("");
  const [pass4Liters2, setPass4Liters2] = useState("XXXX");
  const [pass4Activity2, setPass4Activity2] = useState("X.XX");

  const catalystTypes = [
    " ",
    "Topsoe VK69",
    "MECS Super Gear XLP-310",
    "MECS GR330",
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/equipment-settings")}
              data-testid="button-back-equipment"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Link href="/" data-testid="link-home">
              <span className="font-semibold text-lg text-foreground hover:underline cursor-pointer">Lithium Americas</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-semibold text-foreground">Converter Settings</h1>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed max-w-5xl">
              Configure the catalytic converter and catalyst (vanadium pentoxide on diatoms) parameters, including number of catalyst beds, 
              catalyst activities (catalyst can deactivate over time), catalyst volumes & types, converter diameter, pressure drop parameters, 
              etc. These settings directly affect SO₂ → SO₃ conversion efficiency, pressure drop, and acid plant production.
            </p>
            <div className="mt-6">
              <Button 
                variant="default"
                onClick={() => setLocation("/catalyst-parameter-database")}
                data-testid="button-catalyst-parameter-database"
              >
                Catalyst Parameter Database
              </Button>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex flex-wrap justify-center gap-6">
              <Card className="w-full max-w-xs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    Converter Diameter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-2">
                    <Input
                      id="converter-diameter"
                      value={converterDiameter}
                      onChange={(e) => setConverterDiameter(e.target.value)}
                      data-testid="input-converter-diameter"
                      className="text-center text-lg h-12"
                    />
                    <span className="text-sm text-muted-foreground">ft</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full max-w-xs">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Droplets className="w-4 h-4" />
                    Current Ambient Pressure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-2">
                    {psychrometricQuery.isLoading ? (
                      <div className="text-lg font-mono text-muted-foreground">Loading...</div>
                    ) : psychrometricQuery.data ? (
                      <div className="text-2xl font-semibold font-mono" data-testid="text-Current ambient-pressure">
                        {toInHg(psychrometricQuery.data.conditions.pressure).toFixed(2)}
                      </div>
                    ) : (
                      <div className="text-lg text-muted-foreground">--</div>
                    )}
                    <span className="text-sm text-muted-foreground">inHg</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-1 h-auto p-0"
                      onClick={() => setLocation('/settings/chemical-properties/psychrometric-data')}
                      data-testid="link-psychrometric-data"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Psychrometric Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle data-testid="title-pass-1">Catalyst Parameters: Pass 1</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Type #1:</Label>
                      <Select value={pass1Type1} onValueChange={setPass1Type1}>
                        <SelectTrigger data-testid="select-pass1-type1">
                          <SelectValue placeholder="Dropdown" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalystTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Volume (Liters):</Label>
                      <Input
                        value={pass1Liters1}
                        onChange={(e) => setPass1Liters1(e.target.value)}
                        placeholder="XXXX"
                        data-testid="input-pass1-liters1"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Activity percentage of fresh catalyst:</Label>
                      <Input
                        value={pass1Activity1}
                        onChange={(e) => setPass1Activity1(e.target.value)}
                        placeholder="XX.X"
                        data-testid="input-pass1-activity1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Type #2:</Label>
                      <Select value={pass1Type2} onValueChange={setPass1Type2}>
                        <SelectTrigger data-testid="select-pass1-type2">
                          <SelectValue placeholder="Dropdown" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalystTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Volume (Liters):</Label>
                      <Input
                        value={pass1Liters2}
                        onChange={(e) => setPass1Liters2(e.target.value)}
                        placeholder="XXXX"
                        data-testid="input-pass1-liters2"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Activity percentage of fresh catalyst:</Label>
                      <Input
                        value={pass1Activity2}
                        onChange={(e) => setPass1Activity2(e.target.value)}
                        placeholder="XX.X"
                        data-testid="input-pass1-activity2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle data-testid="title-pass-2">Catalyst Parameters: Pass 2</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Type #1:</Label>
                      <Select value={pass2Type1} onValueChange={setPass2Type1}>
                        <SelectTrigger data-testid="select-pass2-type1">
                          <SelectValue placeholder="Dropdown" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalystTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Volume (Liters):</Label>
                      <Input
                        value={pass2Liters1}
                        onChange={(e) => setPass2Liters1(e.target.value)}
                        placeholder="XXXX"
                        data-testid="input-pass2-liters1"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Activity percentage of fresh catalyst:</Label>
                      <Input
                        value={pass2Activity1}
                        onChange={(e) => setPass2Activity1(e.target.value)}
                        placeholder="XX.X"
                        data-testid="input-pass2-activity1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle data-testid="title-pass-3">Catalyst Parameters: Pass 3</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Type #1:</Label>
                      <Select value={pass3Type1} onValueChange={setPass3Type1}>
                        <SelectTrigger data-testid="select-pass3-type1">
                          <SelectValue placeholder="Dropdown" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalystTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Volume (Liters):</Label>
                      <Input
                        value={pass3Liters1}
                        onChange={(e) => setPass3Liters1(e.target.value)}
                        placeholder="XXXX"
                        data-testid="input-pass3-liters1"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Activity percentage of fresh catalyst:</Label>
                      <Input
                        value={pass3Activity1}
                        onChange={(e) => setPass3Activity1(e.target.value)}
                        placeholder="XX.X"
                        data-testid="input-pass3-activity1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle data-testid="title-pass-4">Catalyst Parameters: Pass 4</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Type #1:</Label>
                      <Select value={pass4Type1} onValueChange={setPass4Type1}>
                        <SelectTrigger data-testid="select-pass4-type1">
                          <SelectValue placeholder="Dropdown" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalystTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Volume (Liters):</Label>
                      <Input
                        value={pass4Liters1}
                        onChange={(e) => setPass4Liters1(e.target.value)}
                        placeholder="XXXX"
                        data-testid="input-pass4-liters1"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Activity percentage of fresh catalyst:</Label>
                      <Input
                        value={pass4Activity1}
                        onChange={(e) => setPass4Activity1(e.target.value)}
                        placeholder="XX.X"
                        data-testid="input-pass4-activity1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Catalyst Type #2:</Label>
                      <Select value={pass4Type2} onValueChange={setPass4Type2}>
                        <SelectTrigger data-testid="select-pass4-type2">
                          <SelectValue placeholder="Dropdown" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalystTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Volume (Liters):</Label>
                      <Input
                        value={pass4Liters2}
                        onChange={(e) => setPass4Liters2(e.target.value)}
                        placeholder="XXXX"
                        data-testid="input-pass4-liters2"
                      />
                    </div>
                    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                      <Label className="text-sm">Activity percentage of fresh catalyst:</Label>
                      <Input
                        value={pass4Activity2}
                        onChange={(e) => setPass4Activity2(e.target.value)}
                        placeholder="XX.X"
                        data-testid="input-pass4-activity2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
