import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, List, Search, ShieldAlert, Power, Droplets, Flame, Wind, Gauge, Thermometer, CheckCircle, ToggleLeft } from 'lucide-react';

type InterlockType = 'interlock' | 'permissive' | 'on-off';

interface InterlockItem {
  id: string;
  description: string;
  category: 'compressor' | 'sulfur' | 'tower' | 'pump' | 'valve' | 'boiler' | 'scrubber' | 'cooling' | 'condensate' | 'acid' | 'export' | 'fan';
  equipment: string;
  type: InterlockType;
}

const interlockData: InterlockItem[] = [
  // Safety Interlocks
  { id: 'I-1', description: 'Shut Down Main Compressor', category: 'compressor', equipment: 'Main Compressor', type: 'interlock' },
  { id: 'I-4', description: 'Close Main Compressor Discharge Valve', category: 'valve', equipment: '1540-HV-4080', type: 'interlock' },
  { id: 'I-7', description: 'Stop Sulfur Feed Pumps and Close Sulfur Feed Valve', category: 'sulfur', equipment: 'Sulfur Feed System', type: 'interlock' },
  { id: 'I-8', description: 'Shut Down Startup Burner', category: 'sulfur', equipment: 'Startup Burner', type: 'interlock' },
  { id: 'I-9', description: 'Isolate Drying/Interpass Tower Dilution Water', category: 'tower', equipment: 'Drying/Interpass Tower', type: 'interlock' },
  { id: 'I-10', description: 'Isolate Final Tower Dilution Water', category: 'tower', equipment: 'Final Tower', type: 'interlock' },
  { id: 'I-13', description: 'Close Combination Pump Tank Level Control Valve', category: 'valve', equipment: '1520-LCV-6040A', type: 'interlock' },
  { id: 'I-14', description: 'Isolate Acid to Product Area', category: 'acid', equipment: 'Product Acid System', type: 'interlock' },
  { id: 'I-15', description: 'Close Dilution Pump Tank Level Control Valve', category: 'valve', equipment: '1520-LCV-6240', type: 'interlock' },
  { id: 'I-16', description: 'Isolate Product Acid Dilution Water', category: 'acid', equipment: 'Product Acid Dilution', type: 'interlock' },
  { id: 'I-21', description: 'Shut Down HP Boiler Feedwater Pumps', category: 'boiler', equipment: '1540-PP-017, 1540-PP-018', type: 'interlock' },
  { id: 'I-23', description: 'Autostart Standby HP Boiler Feedwater Pumps', category: 'boiler', equipment: '1540-PP-017, 1540-PP-018', type: 'interlock' },
  { id: 'I-60', description: 'Shut Down Tail Gas Scrubber Circulation Pumps and Close Scrubber Effluent Valve', category: 'scrubber', equipment: '1530-PP-001, 1530-PP-002, 1530-DCV-0006', type: 'interlock' },
  { id: 'I-61', description: 'Close Tail Gas Scrubber Make-Up Water Valve', category: 'scrubber', equipment: '1530-LCV-0013', type: 'interlock' },
  { id: 'I-62', description: 'Close Caustic Supply Control Valve', category: 'scrubber', equipment: '1530-ACV-0002', type: 'interlock' },
  { id: 'I-65', description: 'Shut Down Oxidation Air Blowers', category: 'scrubber', equipment: '1530-GB-001, 1530-GB-002', type: 'interlock' },
  { id: 'I-83', description: 'Open Treated Water Bypass Valve, Close Water Block Valves, Switch TIC to Manual', category: 'valve', equipment: '1520-XV-6742, 1520-XV-6741, 1520-XV-6738, 1520-TIC-6731', type: 'interlock' },
  { id: 'I-100', description: 'Light Alarm Beacon, Set LIC to Manual and Close Sulfur Feed Valve', category: 'sulfur', equipment: '1510-XA-1118A, 1510-LIC-1007, 1510-LCV-1007', type: 'interlock' },
  { id: 'I-101', description: 'Stop Liquid Sulfur Unloading Pumps', category: 'sulfur', equipment: '1510-PP-001, 1510-PP-002', type: 'interlock' },
  { id: 'I-110', description: 'Stop Fin Fan Cooling Water Pumps', category: 'cooling', equipment: '1520-PP-008, 1520-PP-009, 1520-PP-010', type: 'interlock' },
  { id: 'I-111', description: 'Stop Acid Plant Cooling Tower Pumps', category: 'cooling', equipment: '1550-PP-001, 1550-PP-002', type: 'interlock' },
  { id: 'I-112', description: 'Stop Treated Water Export Pumps', category: 'pump', equipment: '1560-PP-006, 1560-PP-007, 1560-PP-010, 1560-PP-011', type: 'interlock' },
  { id: 'I-115', description: 'Start Bypass Condensate Pump', category: 'condensate', equipment: '1560-PP-019 or 1560-PP-020', type: 'interlock' },
  { id: 'I-121', description: 'Open Off-Spec Condensate Return Valve, Close Condensate Return to BFW Preheater Valve', category: 'condensate', equipment: '1560-XV-7513, 1560-XV-7514', type: 'interlock' },
  { id: 'I-123', description: 'Switch TCV to Manual Mode, Bypass Condensate to Water Treatment', category: 'condensate', equipment: '1560-TCV-3603, 1560-TCV-3604', type: 'interlock' },
  { id: 'I-124', description: 'Stop Water Recovery Pumps', category: 'pump', equipment: '1560-PP-021, 1560-PP-022', type: 'interlock' },
  { id: 'I-126', description: 'Stop ACC Condensate Pumps, Stop Bypass Condensate Pumps', category: 'condensate', equipment: '1560-PP-015, 1560-PP-016, 1560-PP-019, 1560-PP-020', type: 'interlock' },
  { id: 'I-140', description: 'Close Sulfur Vapor Scrubber Blowdown Valve', category: 'scrubber', equipment: '1510-HV-1512', type: 'interlock' },
  { id: 'I-141', description: 'Close Make Up Water Valve', category: 'valve', equipment: '1510-LCV-1524', type: 'interlock' },
  { id: 'I-150', description: 'Stop 98.5% Acid Recirculation Pumps', category: 'acid', equipment: '1570-PP-005, 1570-PP-006', type: 'interlock' },
  { id: 'I-151', description: 'Close Acid Loading Valve', category: 'acid', equipment: '1570-HV-9202', type: 'interlock' },
  { id: 'I-152', description: 'Close Acid Loading Valve', category: 'acid', equipment: '1570-HV-9212', type: 'interlock' },
  { id: 'I-153A', description: 'Stop Acid Heater', category: 'acid', equipment: '1570-ZE-003', type: 'interlock' },
  { id: 'I-154A', description: 'Stop Acid Heater', category: 'acid', equipment: '1570-ZE-004', type: 'interlock' },
  { id: 'I-155', description: 'Close Level Control Valve, Truck Unloading Valve, Start-up Acid Storage Valve, Stop Start-up Acid Unloading Pump', category: 'acid', equipment: '1520-LCV-6240, 1570-HV-9011, 1570-HV-9010, 1570-PP-007', type: 'interlock' },

  // Permissives
  { id: 'I-2', description: 'Main Compressor Start Permissive', category: 'compressor', equipment: 'Main Compressor', type: 'permissive' },
  { id: 'I-80', description: 'Hot Heat Exchanger Bypass Dampers Heat Up Mode Permissive', category: 'valve', equipment: '1540-TCV-5224A, 1540-TCV-5224B, 1540-TIC-5224', type: 'permissive' },
  { id: 'I-81', description: 'Open Hydrogen Vents Permissive', category: 'valve', equipment: '1520-XV-5805, 1520-XV-6630, 1520-XV-8423', type: 'permissive' },
  { id: 'I-156', description: 'Product Acid Transfer Pumps Start Permissive', category: 'acid', equipment: '1570-PP-001, 1570-PP-002', type: 'permissive' },
  { id: 'I-164', description: 'Sulfur Feed Pumps Start Permissive', category: 'sulfur', equipment: '1510-PP-004, 1510-PP-005', type: 'permissive' },
  { id: 'I-171', description: 'Transloading Effluent Unloading Pump Start Permissive', category: 'pump', equipment: '1520-PP-021', type: 'permissive' },
  { id: 'I-200', description: '20% Caustic Solution Export to Lithium Processing Plant Permissive', category: 'export', equipment: '1510-XV-9530', type: 'permissive' },
  { id: 'I-201', description: 'Treated Water Export Pumps (Standby) Start Permissive', category: 'export', equipment: '1560-PP-006, 1560-PP-007', type: 'permissive' },
  { id: 'I-202', description: '150 PSIG Steam Export Station Lithium Processing Plant Start Permissive', category: 'export', equipment: '1560-PCV-6011', type: 'permissive' },
  { id: 'I-302', description: 'Permissive to Open Bypass Desuperheater Valve', category: 'valve', equipment: '1560-PCV-6672', type: 'permissive' },
  { id: 'I-307', description: 'Air Cooled Condenser (ACC) Unit Fan Start Up Permissives', category: 'fan', equipment: 'ACC Unit Fans', type: 'permissive' },
  { id: 'I-308', description: 'Permissive for Air Cooled Condenser (ACC) Start-Up Sequence', category: 'fan', equipment: 'ACC System', type: 'permissive' },
  { id: 'I-317', description: 'Permissive for Opening ACC Holding Skid Air Suction Valve', category: 'valve', equipment: 'V1560-9340', type: 'permissive' },
  { id: 'I-320', description: 'Permissive for Opening Exhaust Steam Line Vacuum Breaker', category: 'valve', equipment: 'V1560-9308', type: 'permissive' },
  { id: 'I-323', description: 'Permissive for Put Fan Assembly Function Group in Auto', category: 'fan', equipment: 'Fan Assembly', type: 'permissive' },

  // On-Off Control Interlocks
  { id: 'I-63A', description: 'Open Raw Water to Oxidation Blowers Air Sparger On/Off Valve', category: 'valve', equipment: '1530-XV-0656', type: 'on-off' },
  { id: 'I-63B', description: 'Close Raw Water to Oxidation Blowers Air Sparger On/Off Valve', category: 'valve', equipment: '1530-XV-0656', type: 'on-off' },
  { id: 'I-103', description: 'Start/Stop Liquid Sulfur Unloading Pumps', category: 'sulfur', equipment: '1510-PP-001, 1510-PP-002', type: 'on-off' },
  { id: 'I-117', description: 'Start, Stop Water Treatment Area Sump Pumps', category: 'pump', equipment: '1560-PP-012 or 1560-PP-013', type: 'on-off' },
  { id: 'I-119', description: 'Start Boiler Blowdown Sump Pump', category: 'boiler', equipment: '1540-PP-001', type: 'on-off' },
  { id: 'I-120', description: 'Stop Boiler Blowdown Sump Pump', category: 'boiler', equipment: '1540-PP-001', type: 'on-off' },
  { id: 'I-137', description: 'Start and Stop Acid Plant Cooling Tower Fan', category: 'fan', equipment: '1550-CT-001', type: 'on-off' },
  { id: 'I-142', description: 'Sulfur Vapor Scrubber Flush Sequence Starts', category: 'scrubber', equipment: '1510-PK-007', type: 'on-off' },
  { id: 'I-153B', description: 'Start/Stop Acid Heater', category: 'acid', equipment: '1570-ZE-003', type: 'on-off' },
  { id: 'I-154B', description: 'Start/Stop Acid Heater', category: 'acid', equipment: '1570-ZE-003', type: 'on-off' },
];

const categoryInfo: Record<string, { label: string; icon: typeof ShieldAlert; color: string }> = {
  compressor: { label: 'Compressor', icon: Wind, color: 'text-blue-500' },
  sulfur: { label: 'Sulfur System', icon: Flame, color: 'text-orange-500' },
  tower: { label: 'Tower', icon: Droplets, color: 'text-cyan-500' },
  pump: { label: 'Pump', icon: Gauge, color: 'text-green-500' },
  valve: { label: 'Valve', icon: Power, color: 'text-purple-500' },
  boiler: { label: 'Boiler', icon: Thermometer, color: 'text-red-500' },
  scrubber: { label: 'Scrubber', icon: Wind, color: 'text-teal-500' },
  cooling: { label: 'Cooling', icon: Droplets, color: 'text-sky-500' },
  condensate: { label: 'Condensate', icon: Droplets, color: 'text-indigo-500' },
  acid: { label: 'Acid System', icon: ShieldAlert, color: 'text-amber-500' },
  export: { label: 'Export', icon: Gauge, color: 'text-emerald-500' },
  fan: { label: 'Fan/ACC', icon: Wind, color: 'text-slate-500' },
};

const typeInfo: Record<InterlockType, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: typeof ShieldAlert }> = {
  interlock: { label: 'Interlock', variant: 'default', icon: ShieldAlert },
  permissive: { label: 'Permissive', variant: 'secondary', icon: CheckCircle },
  'on-off': { label: 'On-Off Control', variant: 'outline', icon: ToggleLeft },
};

export default function LogicList() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<InterlockType | null>(null);

  const filteredData = interlockData.filter((item) => {
    const matchesSearch = 
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.equipment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesType = !selectedType || item.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const categories = Array.from(new Set(interlockData.map(item => item.category)));
  const interlockCount = interlockData.filter(i => i.type === 'interlock').length;
  const permissiveCount = interlockData.filter(i => i.type === 'permissive').length;
  const onOffCount = interlockData.filter(i => i.type === 'on-off').length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation('/settings/interlock-logic')}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <List className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">Interlock Logic List</h1>
                <p className="text-xs text-muted-foreground">Sulfuric Acid Plant Safety Interlocks</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Safety Interlock, Permissive & On-Off Control List</CardTitle>
              <CardDescription>
                Document: 1500-IN-CTN-0000-EXP-5002 Rev A | Thacker Pass Project | {interlockCount} Interlocks, {permissiveCount} Permissives, {onOffCount} On-Off Controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID, description, or equipment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground self-center mr-1">Type:</span>
                    <Button
                      variant={selectedType === null ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedType(null)}
                      data-testid="button-type-all"
                    >
                      All
                    </Button>
                    {(Object.keys(typeInfo) as InterlockType[]).map((t) => {
                      const info = typeInfo[t];
                      const IconComponent = info.icon;
                      return (
                        <Button
                          key={t}
                          variant={selectedType === t ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedType(t)}
                          data-testid={`button-type-${t}`}
                        >
                          <IconComponent className="w-3 h-3 mr-1" />
                          {info.label}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground self-center mr-1">Category:</span>
                    <Button
                      variant={selectedCategory === null ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                      data-testid="button-filter-all"
                    >
                      All
                    </Button>
                    {categories.slice(0, 6).map((cat) => {
                      const info = categoryInfo[cat];
                      return (
                        <Button
                          key={cat}
                          variant={selectedCategory === cat ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedCategory(cat)}
                          data-testid={`button-filter-${cat}`}
                        >
                          {info.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-semibold text-foreground whitespace-nowrap w-20">ID</th>
                        <th className="text-left p-3 font-semibold text-foreground whitespace-nowrap w-32">Type</th>
                        <th className="text-left p-3 font-semibold text-foreground whitespace-nowrap w-28">Category</th>
                        <th className="text-left p-3 font-semibold text-foreground">Description</th>
                        <th className="text-left p-3 font-semibold text-foreground whitespace-nowrap">Equipment Tag(s)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredData.map((item) => {
                        const catInfo = categoryInfo[item.category];
                        const tInfo = typeInfo[item.type];
                        const IconComponent = catInfo.icon;
                        const TypeIcon = tInfo.icon;
                        return (
                          <tr 
                            key={item.id} 
                            className="hover-elevate"
                            data-testid={`row-interlock-${item.id}`}
                          >
                            <td className="p-3 font-mono font-semibold text-primary whitespace-nowrap">
                              {item.id}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <Badge variant={tInfo.variant} className="text-xs">
                                <TypeIcon className="w-3 h-3 mr-1" />
                                {tInfo.label}
                              </Badge>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <IconComponent className={`w-4 h-4 ${catInfo.color}`} />
                                <span className="text-xs text-muted-foreground">{catInfo.label}</span>
                              </div>
                            </td>
                            <td className="p-3 text-foreground">
                              {item.description}
                            </td>
                            <td className="p-3 font-mono text-xs text-muted-foreground">
                              {item.equipment}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                <span>Showing {filteredData.length} of {interlockData.length} items</span>
                <span>Source: Lithium Americas Corp. - Thacker Pass Project</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Interlock Logic List | 1500-IN-CTN-0000-EXP-5002 Rev A</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
