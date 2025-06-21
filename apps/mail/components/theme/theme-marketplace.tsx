import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ThemeCard } from "./theme-card";
import { useEditorStore } from "@/store/editor-store";
import { useTRPC } from "@/providers/query-provider";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import type { ThemeStyles } from "@/types/themes";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "use-intl";

interface PublicTheme {
    id: string;
    name: string;
    styles: ThemeStyles;
    userId?: string;
}

export function ThemeMarketplace() {
    const t = useTranslations();
    const trpc = useTRPC();
    const { themeState, setThemeState } = useEditorStore();
    const queryClient = useQueryClient();
    const { data: session } = useSession();

    // Search state
    const [query, setQuery] = useState("");

    const { data, isLoading, error } = useQuery(trpc.themes.listPublic.queryOptions({ page: 0, limit: 100 }));

    const themes: PublicTheme[] = (data?.themes as PublicTheme[]) ?? [];

    const mode = (themeState.currentMode ?? "light") as "light" | "dark";

    const filtered = themes.filter((t: PublicTheme) =>
        t.name.toLowerCase().includes(query.toLowerCase())
    );

    const { mutateAsync: createTheme } = useMutation(trpc.themes.create.mutationOptions());

    const handleSelect = async (theme: PublicTheme) => {
        if (!theme.styles[mode]) {
            console.error(`Theme styles missing for mode: ${mode}`);
            return;
        }
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
                id: newTheme.id,
                styles: theme.styles,
                preset: undefined,
            });
        } catch (err) {
            console.error("Failed to install theme", err);
            toast.error(t("common.settings.failedToSave"));
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-32 w-full items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-32 w-full items-center justify-center">
                <p className="text-sm text-red-500">{t("common.themeEditor.failedToLoadThemes")}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="text-sm font-medium">{t("common.themeEditor.marketplace")}</p>
            <Input
                placeholder={t("common.themeEditor.searchPlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((theme: PublicTheme) => (
                    <ThemeCard
                        key={theme.id}
                        name={theme.name}
                        styles={theme.styles[mode] ?? {}}
                        onSelect={() => handleSelect(theme)}
                    />
                ))}
            </div>
            {filtered.length === 0 && (
                <p className="text-muted-foreground text-sm">{t("common.themeEditor.noThemesFound")}</p>
            )}
        </div>
    );
} 