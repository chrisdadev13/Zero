"use client";

import { createContext, useContext, useEffect } from "react";
import { useEditorStore } from "../store/editor-store";
import { applyThemeToElement } from "../lib/apply-theme";
import { useThemePresetFromUrl } from "../hooks/use-theme-preset-from-url";
import { useTRPC } from "@/providers/query-provider";
import { useQuery } from "@tanstack/react-query";

type Theme = "dark" | "light";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    connectionId?: string;
};

type Coords = { x: number; y: number };

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: (coords?: Coords) => void;
};

const initialState: ThemeProviderState = {
    theme: "light",
    setTheme: () => null,
    toggleTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ children, connectionId, ...props }: ThemeProviderProps) {
    const { themeState, setThemeState } = useEditorStore();

    const trpc = useTRPC();

    // Fetch theme from DB for connection
    const { data: dbTheme } = connectionId
        ? useQuery(trpc.themes.getByConnectionId.queryOptions({ connectionId }))
        : { data: undefined } as any;

    useEffect(() => {
        if (dbTheme && (dbTheme as any).styles) {
            (setThemeState as any)({
                ...themeState,
                styles: (dbTheme as any).styles,
                id: (dbTheme as any).id,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [(dbTheme as any)?.id]);

    // Handle theme preset from URL
    useThemePresetFromUrl();

    useEffect(() => {
        const root = document.documentElement;
        if (!root) return;

        applyThemeToElement(themeState, root);
    }, [themeState]);

    const handleThemeChange = (newMode: Theme) => {
        setThemeState({ ...themeState, currentMode: newMode });
    };

    const handleThemeToggle = (coords?: Coords) => {
        const root = document.documentElement;
        const newMode = themeState.currentMode === "light" ? "dark" : "light";

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (!document.startViewTransition || prefersReducedMotion) {
            handleThemeChange(newMode);
            return;
        }

        if (coords) {
            root.style.setProperty("--x", `${coords.x}px`);
            root.style.setProperty("--y", `${coords.y}px`);
        }

        document.startViewTransition(() => {
            handleThemeChange(newMode);
        });
    };

    const value: ThemeProviderState = {
        theme: themeState.currentMode,
        setTheme: handleThemeChange,
        toggleTheme: handleThemeToggle,
    };

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }

    return context;
};