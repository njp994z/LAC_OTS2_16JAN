import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ClipboardList, Search } from "lucide-react";
import equipmentData from "@/data/equipment-list.json";

interface EquipmentItem {
  ITEM: string;
  "EQUIPMENT NUMBER": string;
  "EQUIPMENT NAME": string;
  "DESCRIPTION (Note 2)": string;
  "PID REFERENCE": string;
  QTY: string;
  "OPERATING / STANDBY": string;
  UNITS: string;
  "MATERIAL (Note 2)": string;
  "DIMENSIONS (ft) (Note 2)": string;
  "PACKAGE NO.": string;
  "PACKAGE NAME": string;
  "DESIGN FLOW RATE  [M3/H]": string;
  "DESIGN PRESS (PSIG)": string;
  "DESIGN TEMP (DEG. F)": string;
  "DESIGN TEMP (DEG. C)": string;
  "MOTOR SIZE (HP)": string;
  "MOTOR VOLTAGE (V)": string;
  "MOTOR PHASE (PH)": string;
  "HEAT DUTY (MMBTU/HR)": string;
  "SURFACE AREA (M2)": string;
}

const equipment = equipmentData as EquipmentItem[];

export default function EquipmentList() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [scrollWidth, setScrollWidth] = useState(0);
  
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  const filteredEquipment = equipment.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item["EQUIPMENT NUMBER"]?.toLowerCase().includes(searchLower) ||
      item["EQUIPMENT NAME"]?.toLowerCase().includes(searchLower) ||
      item["DESCRIPTION (Note 2)"]?.toLowerCase().includes(searchLower) ||
      item["PACKAGE NAME"]?.toLowerCase().includes(searchLower)
    );
  });

  // Sync scrollbar width with table scroll width
  useEffect(() => {
    const updateScrollWidth = () => {
      if (tableContainerRef.current) {
        setScrollWidth(tableContainerRef.current.scrollWidth);
      }
    };
    
    updateScrollWidth();
    window.addEventListener('resize', updateScrollWidth);
    return () => window.removeEventListener('resize', updateScrollWidth);
  }, [filteredEquipment]);

  // Sync scroll positions between table and sticky scrollbar
  const handleTableScroll = () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (scrollbarRef.current && tableContainerRef.current) {
      scrollbarRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
    }
    isSyncingRef.current = false;
  };

  const handleScrollbarScroll = () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (tableContainerRef.current && scrollbarRef.current) {
      tableContainerRef.current.scrollLeft = scrollbarRef.current.scrollLeft;
    }
    isSyncingRef.current = false;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/settings/equipment-sizes")}
              data-testid="button-back-equipment-sizes"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">Equipment List</h1>
              <p className="text-xs text-muted-foreground">Complete inventory of acid plant equipment ({equipment.length} items)</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-full mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-6 h-6 text-primary" />
                  <div>
                    <CardTitle>Mechanical Equipment List</CardTitle>
                    <CardDescription>
                      Complete inventory of all major equipment in the acid plant
                    </CardDescription>
                  </div>
                </div>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search equipment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-equipment"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Outer wrapper - manages vertical scroll and sticky behavior */}
              <div className="border rounded-md max-h-[70vh] overflow-y-auto relative">
                {/* Table container with synchronized horizontal scroll */}
                <div 
                  ref={tableContainerRef}
                  onScroll={handleTableScroll}
                  className="overflow-x-auto"
                >
                  <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="sticky left-0 bg-muted/50 z-10 min-w-[60px]">Item</TableHead>
                      <TableHead className="min-w-[180px]">Equipment Number</TableHead>
                      <TableHead className="min-w-[200px]">Equipment Name</TableHead>
                      <TableHead className="min-w-[200px]">Description</TableHead>
                      <TableHead className="min-w-[180px]">PID Reference</TableHead>
                      <TableHead className="min-w-[60px] text-center">Qty</TableHead>
                      <TableHead className="min-w-[100px] text-center">Op/Standby</TableHead>
                      <TableHead className="min-w-[60px]">Units</TableHead>
                      <TableHead className="min-w-[150px]">Material</TableHead>
                      <TableHead className="min-w-[150px]">Dimensions (ft)</TableHead>
                      <TableHead className="min-w-[100px]">Package No.</TableHead>
                      <TableHead className="min-w-[200px]">Package Name</TableHead>
                      <TableHead className="min-w-[120px] text-right">Flow Rate (M³/H)</TableHead>
                      <TableHead className="min-w-[100px] text-right">Press (PSIG)</TableHead>
                      <TableHead className="min-w-[100px] text-right">Temp (°F)</TableHead>
                      <TableHead className="min-w-[100px] text-right">Temp (°C)</TableHead>
                      <TableHead className="min-w-[100px] text-right">Motor (HP)</TableHead>
                      <TableHead className="min-w-[100px] text-right">Voltage (V)</TableHead>
                      <TableHead className="min-w-[80px] text-right">Phase</TableHead>
                      <TableHead className="min-w-[120px] text-right">Heat Duty</TableHead>
                      <TableHead className="min-w-[100px] text-right">Area (M²)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipment.map((item, index) => (
                      <TableRow key={index} data-testid={`row-equipment-${index}`}>
                        <TableCell className="sticky left-0 bg-background z-10 font-medium">{item.ITEM}</TableCell>
                        <TableCell className="font-mono text-xs">{item["EQUIPMENT NUMBER"]}</TableCell>
                        <TableCell className="font-medium">{item["EQUIPMENT NAME"]}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{item["DESCRIPTION (Note 2)"]}</TableCell>
                        <TableCell className="font-mono text-xs">{item["PID REFERENCE"]}</TableCell>
                        <TableCell className="text-center">{item.QTY}</TableCell>
                        <TableCell className="text-center">{item["OPERATING / STANDBY"]}</TableCell>
                        <TableCell>{item.UNITS}</TableCell>
                        <TableCell className="text-sm">{item["MATERIAL (Note 2)"]}</TableCell>
                        <TableCell className="text-sm">{item["DIMENSIONS (ft) (Note 2)"]}</TableCell>
                        <TableCell>{item["PACKAGE NO."]}</TableCell>
                        <TableCell className="text-sm">{item["PACKAGE NAME"]}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{item["DESIGN FLOW RATE  [M3/H]"]}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{item["DESIGN PRESS (PSIG)"]}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{item["DESIGN TEMP (DEG. F)"]}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{item["DESIGN TEMP (DEG. C)"]}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{item["MOTOR SIZE (HP)"]}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{item["MOTOR VOLTAGE (V)"]}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{item["MOTOR PHASE (PH)"]}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{item["HEAT DUTY (MMBTU/HR)"]}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{item["SURFACE AREA (M2)"]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </div>
                
                {/* Sticky horizontal scrollbar - pins to bottom of scrolling container */}
                <div 
                  ref={scrollbarRef}
                  onScroll={handleScrollbarScroll}
                  className="sticky bottom-0 left-0 right-0 overflow-x-auto bg-card/95 backdrop-blur-sm border-t z-20"
                  style={{ height: '16px' }}
                >
                  <div style={{ width: scrollWidth, height: '1px' }} />
                </div>
              </div>
              
              <div className="mt-4 text-sm text-muted-foreground">
                Showing {filteredEquipment.length} of {equipment.length} equipment items
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Equipment List | Reference Data</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
