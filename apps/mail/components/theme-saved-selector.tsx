import { useTRPC } from "@/providers/query-provider";
import { useEditorStore } from "@/store/editor-store";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Globe2, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button";
import { ThemeCard } from "@/components/theme/theme-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zero/server/trpc";

type Theme = inferRouterOutputs<AppRouter>["themes"]["list"][number];

export function UserThemeSelector() {
    const trpc = useTRPC();
    const { themeState, setThemeState } = useEditorStore();
    const t = useTranslations();

    const { data: themes = [], refetch, error, isLoading } = useQuery(trpc.themes.list.queryOptions());

    const queryClient = useQueryClient();

    const { mutateAsync: updateTheme } = useMutation(trpc.themes.update.mutationOptions());
    const { mutateAsync: deleteTheme } = useMutation(trpc.themes.delete.mutationOptions());

    const [selectedId, setSelectedId] = useState<string>(themeState.id ?? "");

    // keep selectedId in sync with themeState.id
    useEffect(() => {
        if (themeState.id !== selectedId) {
            setSelectedId(themeState.id ?? "");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [themeState.id]);

    const selectedTheme = useMemo(() => (themes as Theme[]).find((t) => t.id === selectedId), [themes, selectedId]);

    // Determine current UI mode to preview correct styles
    const mode = (themeState.currentMode ?? "light") as "light" | "dark";

    const togglePublic = async () => {
        if (!selectedTheme) return;
        try {
            await updateTheme({
                themeId: selectedTheme.id,
                theme: {
                    name: selectedTheme.name,
                    styles: selectedTheme.styles,
                    public: !selectedTheme.public,
                },
                public: !selectedTheme.public,
            });
            await refetch();
            queryClient.invalidateQueries({ queryKey: trpc.themes.listPublic.queryKey() });
        } catch (error) {
            console.error("Failed to update theme", error);
            toast.error(t("common.settings.failedToSave"));
        }
    };

    const handleDelete = async () => {
        if (!selectedTheme) return;
        try {
            await deleteTheme({ themeId: selectedTheme.id });
            // Clear from state if currently selected
            if (themeState.id === selectedTheme.id) {
                setThemeState({ ...themeState, id: undefined });
            }
            setSelectedId("");
            await refetch();
            queryClient.invalidateQueries({ queryKey: trpc.themes.listPublic.queryKey() });
        } catch (error) {
            console.error("Failed to delete theme", error);
            toast.error(t("common.settings.failedToSave"));
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <p className="py-0 text-sm font-medium">{t("common.themeEditor.savedThemes")}</p>
                <div className="grid gap-4 grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <Skeleton className="w-36 aspect-square rounded-lg" />
                            <Skeleton className="mt-2 h-3 w-24" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-2">
                <p className="text-sm text-destructive">
                    {t("common.themeEditor.failedToLoadThemes")}
                </p>
                <Button type="button" size="sm" onClick={() => refetch()}>
                    {t("common.actions.refresh")}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <p className="py-0 text-sm font-medium">{t("common.themeEditor.savedThemes")}</p>

            {/* Saved themes as cards */}
            <div className="grid gap-4 grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
                {(themes as Theme[]).map((theme) => (
                    <div key={theme.id} className="relative">
                        <ThemeCard
                            name={theme.name}
                            styles={theme.styles[mode] ?? {}}
                            selected={selectedId === theme.id}
                            onSelect={() => {
                                setSelectedId(theme.id);
                                setThemeState({
                                    ...themeState,
                                    id: theme.id,
                                    styles: theme.styles,
                                    preset: undefined,
                                });
                            }}
                        />
                        {/* Public/Private icon overlay */}
                        <div className="absolute top-2 left-2">
                            {theme.public ? (
                                <Globe2 size={14} className="text-background/80" />
                            ) : (
                                <Lock size={14} className="text-background/80" />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls for selected theme */}
            {selectedTheme && (
                <div className="flex items-center gap-2 pt-1">
                    <Switch checked={selectedTheme.public} onCheckedChange={togglePublic} />
                    <span className="text-xs text-muted-foreground">
                        {selectedTheme.public ? t("common.themeEditor.public") : t("common.themeEditor.private")}
                    </span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleDelete}
                        className="ml-auto text-red-500 hover:text-red-600"
                        aria-label={t("common.actions.remove")}
                    >
                        <Trash2 size={14} />
                    </Button>
                </div>
            )}
        </div>
    );
} 