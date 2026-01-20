import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code, Copy, Check, ChevronDown, ExternalLink, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodeFile {
  id: string;
  title: string;
  description: string;
  code: string;
}

interface LinkItem {
  id: string;
  title: string;
  href: string;
  isLink: true;
}

type DropdownItem = CodeFile | LinkItem;

interface PythonCodeDropdownProps {
  files: DropdownItem[];
  buttonVariant?: 'default' | 'outline' | 'ghost' | 'secondary';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
}

function highlightPython(code: string): JSX.Element[] {
  const lines = code.split('\n');
  
  const keywords = ['def', 'return', 'if', 'else', 'elif', 'for', 'while', 'in', 'import', 'from', 'as', 'class', 'try', 'except', 'finally', 'with', 'lambda', 'yield', 'raise', 'pass', 'break', 'continue', 'and', 'or', 'not', 'is', 'None', 'True', 'False'];
  const builtins = ['print', 'range', 'len', 'str', 'int', 'float', 'list', 'dict', 'tuple', 'set', 'min', 'max', 'sum', 'abs', 'round', 'type', 'isinstance', 'enumerate', 'zip', 'map', 'filter', 'sorted', 'reversed', 'open', 'input', 'format'];
  
  return lines.map((line, lineIndex) => {
    const tokens: JSX.Element[] = [];
    let i = 0;
    let tokenKey = 0;
    
    while (i < line.length) {
      if (line[i] === '#') {
        tokens.push(<span key={tokenKey++} style={{ color: '#6A9955', fontStyle: 'italic' }}>{line.slice(i)}</span>);
        break;
      }
      
      if (line.slice(i, i + 3) === '"""' || line.slice(i, i + 3) === "'''") {
        const quote = line.slice(i, i + 3);
        let end = line.indexOf(quote, i + 3);
        if (end === -1) {
          tokens.push(<span key={tokenKey++} style={{ color: '#CE9178' }}>{line.slice(i)}</span>);
          break;
        }
        tokens.push(<span key={tokenKey++} style={{ color: '#CE9178' }}>{line.slice(i, end + 3)}</span>);
        i = end + 3;
        continue;
      }
      
      if (line[i] === '"' || line[i] === "'") {
        const quote = line[i];
        let end = i + 1;
        while (end < line.length && line[end] !== quote) {
          if (line[end] === '\\') end++;
          end++;
        }
        tokens.push(<span key={tokenKey++} style={{ color: '#CE9178' }}>{line.slice(i, end + 1)}</span>);
        i = end + 1;
        continue;
      }
      
      if (/[0-9]/.test(line[i]) && (i === 0 || !/[a-zA-Z_]/.test(line[i - 1]))) {
        let end = i;
        while (end < line.length && /[0-9.eE+-]/.test(line[end])) end++;
        tokens.push(<span key={tokenKey++} style={{ color: '#B5CEA8' }}>{line.slice(i, end)}</span>);
        i = end;
        continue;
      }
      
      if (/[a-zA-Z_]/.test(line[i])) {
        let end = i;
        while (end < line.length && /[a-zA-Z0-9_]/.test(line[end])) end++;
        const word = line.slice(i, end);
        
        const beforeWord = line.slice(0, i).trim();
        const afterWord = line.slice(end).trim();
        
        if (keywords.includes(word)) {
          tokens.push(<span key={tokenKey++} style={{ color: '#569CD6', fontWeight: 500 }}>{word}</span>);
        } else if (builtins.includes(word)) {
          tokens.push(<span key={tokenKey++} style={{ color: '#DCDCAA' }}>{word}</span>);
        } else if (beforeWord.endsWith('def')) {
          tokens.push(<span key={tokenKey++} style={{ color: '#DCDCAA' }}>{word}</span>);
        } else if (afterWord.startsWith('(') && !beforeWord.endsWith('def')) {
          tokens.push(<span key={tokenKey++} style={{ color: '#DCDCAA' }}>{word}</span>);
        } else if (word === word.toUpperCase() && word.length > 1) {
          tokens.push(<span key={tokenKey++} style={{ color: '#4FC1FF' }}>{word}</span>);
        } else {
          tokens.push(<span key={tokenKey++} style={{ color: '#9CDCFE' }}>{word}</span>);
        }
        i = end;
        continue;
      }
      
      if (/[+\-*/%=<>!&|^~@:]/.test(line[i])) {
        let end = i;
        while (end < line.length && /[+\-*/%=<>!&|^~@:]/.test(line[end])) end++;
        tokens.push(<span key={tokenKey++} style={{ color: '#D4D4D4' }}>{line.slice(i, end)}</span>);
        i = end;
        continue;
      }
      
      tokens.push(<span key={tokenKey++}>{line[i]}</span>);
      i++;
    }
    
    return (
      <div key={lineIndex} className="leading-6">
        <span className="inline-block w-10 text-right pr-3 select-none" style={{ color: '#858585' }}>{lineIndex + 1}</span>
        {tokens.length > 0 ? tokens : '\n'}
      </div>
    );
  });
}

function isLinkItem(item: DropdownItem): item is LinkItem {
  return 'isLink' in item && item.isLink === true;
}

export function PythonCodeDropdown({
  files,
  buttonVariant = 'outline',
  buttonSize = 'default',
}: PythonCodeDropdownProps) {
  const [, setLocation] = useLocation();
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const highlightedCode = useMemo(() => {
    if (!selectedFile) return [];
    return highlightPython(selectedFile.code);
  }, [selectedFile]);

  const handleCopy = async () => {
    if (!selectedFile) return;
    await navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Python code has been copied to your clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (file: CodeFile) => {
    const blob = new Blob([file.code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.id}.py`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast({
      title: "Download started",
      description: `Downloading ${file.id}.py`,
    });
  };

  const handleItemClick = (item: DropdownItem) => {
    if (isLinkItem(item)) {
      setLocation(item.href);
    } else {
      setSelectedFile(item);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={buttonVariant} size={buttonSize} className="gap-2" data-testid="dropdown-see-python-code">
            <Code className="w-4 h-4" />
            See Python Code
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {files.map((item) => (
            <div key={item.id} className="flex items-center gap-1 px-1">
              <DropdownMenuItem 
                className="flex-1"
                onClick={() => handleItemClick(item)}
                data-testid={`dropdown-item-${item.id}`}
              >
                {isLinkItem(item) ? (
                  <ExternalLink className="w-4 h-4 mr-2" />
                ) : (
                  <Code className="w-4 h-4 mr-2" />
                )}
                {item.title}
              </DropdownMenuItem>
              {!isLinkItem(item) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(item as CodeFile);
                  }}
                  data-testid={`button-download-${item.id}`}
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                {selectedFile?.title}
              </div>
              {selectedFile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleDownload(selectedFile)}
                  data-testid="button-download-dialog"
                >
                  <Download className="w-4 h-4" />
                  Download .py
                </Button>
              )}
            </DialogTitle>
            <DialogDescription>{selectedFile?.description}</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10"
              onClick={handleCopy}
              data-testid="button-copy-code"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
            <ScrollArea className="h-[60vh] rounded-md border bg-[#1e1e1e]">
              <pre className="p-4 text-sm font-mono whitespace-pre overflow-x-auto">
                {highlightedCode}
              </pre>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
