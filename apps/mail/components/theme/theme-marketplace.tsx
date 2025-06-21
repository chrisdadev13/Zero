"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ThemeCard } from "./theme-card";
import { useEditorStore } from "@/store/editor-store";
import { useTRPC } from "@/providers/query-provider";
import { useQuery } from "@tanstack/react-query";

interface PublicTheme {
    id: string;
    name: string;
    styles: Record<string, any>;
    userId?: string;
    creatorName?: string;
}

export function ThemeMarketplace() {
    const trpc = useTRPC();
    const { themeState, setThemeState } = useEditorStore();

    // Search state
    const [query, setQuery] = useState("");

    const { data } = useQuery(trpc.themes.listPublic.queryOptions({ page: 0, limit: 100 }));

    const themes: PublicTheme[] = (data?.themes as PublicTheme[]) ?? [];

    const mode = (themeState.currentMode ?? "light") as "light" | "dark";

    const filtered = themes.filter((t: PublicTheme) =>
        t.name.toLowerCase().includes(query.toLowerCase())
    );

    const handleSelect = (styles: any) => {
        setThemeState({
            ...themeState,
            styles,
            preset: undefined,
        });
    };

    return (
        <div className="space-y-4">
            <p className="text-sm font-medium">Marketplace</p>
            <Input
                placeholder="Search for themes.."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((theme: PublicTheme) => (
                    <ThemeCard
                        key={theme.id}
                        name={theme.name}
                        creator={theme.creatorName ?? theme.userId?.slice(0, 6) ?? ""}
                        styles={theme.styles[mode]}
                        onSelect={() => handleSelect(theme.styles)}
                    />
                ))}
            </div>
            {themes.length === 0 && (
                <p className="text-muted-foreground text-sm">No themes found.</p>
            )}
        </div>
    );
} 