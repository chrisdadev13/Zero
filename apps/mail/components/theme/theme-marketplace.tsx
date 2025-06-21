"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ThemeCard } from "./theme-card";
import { useEditorStore } from "@/store/editor-store";
import { useTRPC } from "@/providers/query-provider";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import type { ThemeStyles } from "@/types/themes";

interface PublicTheme {
    id: string;
    name: string;
    styles: ThemeStyles;
    userId?: string;
}

export function ThemeMarketplace() {
    const trpc = useTRPC();
    const { themeState, setThemeState } = useEditorStore();
    const queryClient = useQueryClient();
    const { data: session } = useSession();

    // Search state
    const [query, setQuery] = useState("");

    const { data } = useQuery(trpc.themes.listPublic.queryOptions({ page: 0, limit: 100 }));

    const themes: PublicTheme[] = (data?.themes as PublicTheme[]) ?? [];

    const mode = (themeState.currentMode ?? "light") as "light" | "dark";

    const filtered = themes.filter((t: PublicTheme) =>
        t.name.toLowerCase().includes(query.toLowerCase())
    );

    const { mutateAsync: createTheme } = useMutation(trpc.themes.create.mutationOptions());

    const handleSelect = async (theme: PublicTheme) => {
        // If current user already owns theme, just apply
        if (theme.userId === session?.user.id) {
            setThemeState({
                ...themeState,
                id: theme.id,
                styles: theme.styles,
                preset: undefined,
            });
            return;
        }

        // Otherwise, install (copy) the theme under user's account
        try {
            const newTheme = await createTheme({
                theme: {
                    name: theme.name,
                    styles: theme.styles,
                    public: true,
                },
            });

            // Invalidate user's theme list and marketplace (optional)
            queryClient.invalidateQueries({ queryKey: trpc.themes.list.queryKey() });

            setThemeState({
                ...themeState,
                id: (newTheme as any)?.id ?? undefined,
                styles: theme.styles,
                preset: undefined,
            });
        } catch (err) {
            console.error("Failed to install theme", err);
        }
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
                        creator={undefined}
                        styles={theme.styles[mode]}
                        onSelect={() => handleSelect(theme)}
                    />
                ))}
            </div>
            {themes.length === 0 && (
                <p className="text-muted-foreground text-sm">No themes found.</p>
            )}
        </div>
    );
} 