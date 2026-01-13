import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TurboGeneratorConfig {
  tagName: string;
  description: string;
  unit: string;
  engineeringUnits: string;
  transparentBackground: boolean;
}

interface TurboGeneratorContextType {
  config: TurboGeneratorConfig;
  updateConfig: (newConfig: Partial<TurboGeneratorConfig>) => Promise<void>;
  isSaving: boolean;
  isLoading: boolean;
}

const DEFAULT_CONFIG: TurboGeneratorConfig = {
  tagName: "1560-TG-001",
  description: "Turbo Generator Set",
  unit: "U-1560",
  engineeringUnits: "MW",
  transparentBackground: false,
};

const TurboGeneratorContext = createContext<TurboGeneratorContextType | undefined>(undefined);

export const TurboGeneratorProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const controllerId = "1560-TG-001";

  const { data: serverConfig, isLoading } = useQuery({
    queryKey: ["/api/controller-configs", controllerId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/controller-configs/${controllerId}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.config as TurboGeneratorConfig;
      } catch (e) {
        return null;
      }
    },
  });

  const [localConfig, setLocalConfig] = useState<TurboGeneratorConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    if (serverConfig) {
      setLocalConfig(serverConfig);
    }
  }, [serverConfig]);

  const mutation = useMutation({
    mutationFn: async (newConfig: TurboGeneratorConfig) => {
      await apiRequest("POST", "/api/controller-configs", {
        controllerId,
        config: newConfig,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/controller-configs", controllerId] });
      toast({ title: "Success", description: "Turbo Generator settings updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    },
  });

  const updateConfig = async (newConfig: Partial<TurboGeneratorConfig>) => {
    const updated = { ...localConfig, ...newConfig };
    setLocalConfig(updated);
    await mutation.mutateAsync(updated);
  };

  return (
    <TurboGeneratorContext.Provider
      value={{
        config: localConfig,
        updateConfig,
        isSaving: mutation.isPending,
        isLoading,
      }}
    >
      {children}
    </TurboGeneratorContext.Provider>
  );
};

export const useTurboGenerator = () => {
  const context = useContext(TurboGeneratorContext);
  if (context === undefined) {
    throw new Error("useTurboGenerator must be used within a TurboGeneratorProvider");
  }
  return context;
};
