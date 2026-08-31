import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type AdminWorkspaceMode = "gomytruck" | "metromitra" | "all";

export interface WorkspaceMetadata {
  id: AdminWorkspaceMode;
  title: string;
  domain: string;
  tagline: string;
  badge: string;
  accentColor: string;
  iconBg: string;
}

export const WORKSPACE_CONFIGS: Record<AdminWorkspaceMode, WorkspaceMetadata> = {
  gomytruck: {
    id: "gomytruck",
    title: "GoMyTruck Admin",
    domain: "gomytruck.com",
    tagline: "Freight & Fleet Logistics",
    badge: "Logistics",
    accentColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  metromitra: {
    id: "metromitra",
    title: "MetroMitra Admin",
    domain: "metromitra.com",
    tagline: "Workforce & Home Services",
    badge: "Workforce",
    accentColor: "text-indigo-400",
    iconBg: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  },
  all: {
    id: "all",
    title: "Super Admin",
    domain: "All Operations",
    tagline: "Unified Platform Control",
    badge: "Unified",
    accentColor: "text-blue-400",
    iconBg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
};

interface WorkspaceContextValue {
  mode: AdminWorkspaceMode;
  setMode: (mode: AdminWorkspaceMode) => void;
  config: WorkspaceMetadata;
  isGoMyTruck: boolean;
  isMetroMitra: boolean;
  isAll: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

const STORAGE_KEY = "admin_active_workspace_mode";

export function AdminWorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AdminWorkspaceMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "gomytruck" || saved === "metromitra" || saved === "all") {
        return saved;
      }
    }
    return "all";
  });

  const setMode = useCallback((newMode: AdminWorkspaceMode) => {
    setModeState(newMode);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newMode);
    }
  }, []);

  const config = WORKSPACE_CONFIGS[mode] || WORKSPACE_CONFIGS.all;

  return (
    <WorkspaceContext.Provider
      value={{
        mode,
        setMode,
        config,
        isGoMyTruck: mode === "gomytruck",
        isMetroMitra: mode === "metromitra",
        isAll: mode === "all",
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useAdminWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useAdminWorkspace must be used within an AdminWorkspaceProvider");
  }
  return context;
}
