import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

const AlarmFaceplatePage = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          to="/"
          className={cn(
            "inline-flex items-center gap-2 mb-6 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
            "text-muted-foreground hover:text-foreground",
            "hover:bg-card/50 active:scale-95"
          )}
        >
          <ArrowLeft size={18} />
          Back
        </Link>

        <header className="mb-10 text-center">
          <h1 className={cn(
            "text-3xl font-bold mb-3 tracking-tight",
            "bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent"
          )}>
            Delta V Alarm Faceplates
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">
            Alarm HMI Interface Components
          </p>
        </header>

        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Alarm faceplate components coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default AlarmFaceplatePage;
