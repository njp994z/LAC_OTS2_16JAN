import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Table, Search, ShieldAlert, CheckCircle, ToggleLeft, Download } from 'lucide-react';
import interlockData from '@/data/interlock-logic-spreadsheet.json';

type TypeFilter = 'all' | 'Interlock' | 'Permissive' | 'On-Off';

export default function SpreadsheetLogic() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const filteredInterlocks = interlockData.interlocks.filter((item) => {
    const matchesSearch = 
      item.tagNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serviceDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Interlock':
        return (
          <Badge variant="destructive" className="gap-1 whitespace-nowrap">
            <ShieldAlert className="w-3 h-3" />
            Interlock
          </Badge>
        );
      case 'Permissive':
        return (
          <Badge variant="secondary" className="gap-1 whitespace-nowrap bg-blue-600 text-white hover:bg-blue-700">
            <CheckCircle className="w-3 h-3" />
            Permissive
          </Badge>
        );
      case 'On-Off':
        return (
          <Badge variant="outline" className="gap-1 whitespace-nowrap">
            <ToggleLeft className="w-3 h-3" />
            On-Off
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const downloadJSON = () => {
    const dataStr = JSON.stringify(interlockData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interlock_logic_spreadsheet.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const typeFilters: { label: string; value: TypeFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Interlock', value: 'Interlock' },
    { label: 'Permissive', value: 'Permissive' },
    { label: 'On-Off', value: 'On-Off' },
  ];

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
              <Table className="w-6 h-6 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">Interlock Spreadsheet Logic</h1>
                <p className="text-xs text-muted-foreground">Detailed logic with inputs, outputs, and conditions</p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadJSON}
            className="gap-2"
            data-testid="button-download-json"
          >
            <Download className="w-4 h-4" />
            Download JSON
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-full mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interlock Logic Matrix</CardTitle>
              <CardDescription>
                {filteredInterlocks.length} of {interlockData.interlocks.length} items | 
                {interlockData.columns.length} condition columns | Python-readable JSON format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by tag or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {typeFilters.map((filter) => (
                    <Button
                      key={filter.value}
                      variant={typeFilter === filter.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTypeFilter(filter.value)}
                      data-testid={`button-filter-${filter.value}`}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0 z-10">
                      <tr className="h-24">
                        <th className="sticky left-0 z-20 bg-muted/50 px-3 py-4 text-left font-medium whitespace-nowrap border-r align-bottom">
                          Tag No.
                        </th>
                        <th className="px-3 py-4 text-left font-medium whitespace-nowrap align-bottom">Type</th>
                        <th className="px-3 py-4 text-left font-medium min-w-[300px] align-bottom">Service Description</th>
                        <th className="px-3 py-4 text-center font-medium whitespace-nowrap align-bottom">Status</th>
                        <th className="px-3 py-4 text-center font-medium whitespace-nowrap align-bottom">Action</th>
                        {interlockData.columns.map((col, idx) => (
                          <th
                            key={idx}
                            className="px-2 py-4 text-center font-medium min-w-[140px] max-w-[160px] text-xs border-l align-bottom"
                            title={col}
                          >
                            <div className="line-clamp-3 leading-tight">{col}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInterlocks.map((item, rowIdx) => (
                        <tr
                          key={item.tagNo}
                          className={rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                          data-testid={`row-interlock-${item.tagNo}`}
                        >
                          <td className="sticky left-0 z-10 px-3 py-2 font-mono text-xs font-semibold whitespace-nowrap border-r bg-inherit">
                            {item.tagNo}
                          </td>
                          <td className="px-3 py-2">{getTypeBadge(item.type)}</td>
                          <td className="px-3 py-2 text-xs">{item.serviceDescription}</td>
                          <td className="px-3 py-2 text-center">
                            <Badge variant="outline" className="text-xs">
                              {item.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Badge
                              variant={item.interlocking === 'Trip' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {item.interlocking}
                            </Badge>
                          </td>
                          {item.conditions.map((val, colIdx) => (
                            <td
                              key={colIdx}
                              className={`px-2 py-2 text-center text-xs border-l ${
                                val === 1
                                  ? 'bg-green-500/20 text-green-600 dark:text-green-400 font-bold'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <h3 className="text-sm font-semibold mb-2">Legend</h3>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500/20 border rounded"></div>
                    <span>1 = Condition triggers this interlock</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-background border rounded"></div>
                    <span>0 = Condition does not apply</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-3 px-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Interlock Spreadsheet Logic | {interlockData.interlocks.length} Items | {interlockData.columns.length} Conditions</span>
          <span>Lithium Americas OTS</span>
        </div>
      </footer>
    </div>
  );
}
