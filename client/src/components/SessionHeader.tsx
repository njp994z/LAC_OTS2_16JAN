import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Monitor } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function SessionHeader() {
  const { shortSessionId, startNewSession, isInitialized } = useSession();

  const handleNewSession = () => {
    if (confirm('Start a new session? This will clear all current session data and create a fresh workspace.')) {
      startNewSession();
      window.location.reload();
    }
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="font-mono text-xs gap-1.5" data-testid="badge-session-id">
            <Monitor className="h-3 w-3" />
            {shortSessionId}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Session ID - Shared across all tabs</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewSession}
            className="h-8 w-8"
            data-testid="button-new-session"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Start New Session</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
