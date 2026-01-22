import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { pfdConfigs } from "../config/pfdConfig";

interface PFDNavigationProps {
  position?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  className?: string;
}

export function PFDNavigation({
  position = "bottom-right",
  className = "",
}: PFDNavigationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [location] = useLocation();

  const positionClasses = {
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 ${className}`}
      data-testid="pfd-navigation-container"
    >
      <div className="flex flex-col items-end gap-2">
        {isExpanded && (
          <div
            className="bg-card border border-border rounded-md shadow-lg p-2 max-h-[70vh] overflow-y-auto w-72"
            data-testid="pfd-navigation-menu"
          >
            <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
              PROCESS FLOW DIAGRAMS
            </div>
            <div className="flex flex-col gap-1">
              {pfdConfigs.map((pfd) => {
                const isActive = location === pfd.route;
                return (
                  <Button
                    key={pfd.id}
                    asChild
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Link
                      href={pfd.route}
                      data-testid={`pfd-nav-link-${pfd.id}`}
                    >
                      <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                      <div className="flex flex-col items-start min-w-0 gap-0">
                        <span className="text-[10px] text-muted-foreground font-mono truncate w-full leading-tight">
                          {pfd.documentNumber}
                        </span>
                        <span className="text-xs font-medium truncate w-full leading-tight">
                          {pfd.title}
                        </span>
                      </div>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="default"
          size="sm"
          className="gap-2 shadow-lg"
          data-testid="pfd-navigation-toggle"
        >
          <FileText className="w-4 h-4" />
          <span>PFDs</span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
