import { useTRPC } from "@/providers/query-provider";
import { useEditorStore } from "@/store/editor-store";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe2, Lock, Trash2, Loader2, PenLine } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button";
import { ThemeCard } from "@/components/theme/theme-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zero/server/trpc";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { defaultThemeState } from "@/config/theme";
import { Link } from "react-router";
import { Switch } from "@/components/ui/switch";

type Theme = inferRouterOutputs<AppRouter>["themes"]["list"][number];

export function UserThemeSelector() {
    const trpc = useTRPC();
    const { themeState, setThemeState, applyThemePreset } = useEditorStore();
    const t = useTranslations();

    const { data: themes = [], refetch, error, isLoading } = useQuery(trpc.themes.list.queryOptions());

    const queryClient = useQueryClient();

    const { mutateAsync: updateTheme } = useMutation(trpc.themes.update.mutationOptions());
    const { mutateAsync: deleteTheme } = useMutation(trpc.themes.delete.mutationOptions());

    const [selectedId, setSelectedId] = useState<string>(themeState.id ?? "");
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    // keep selectedId in sync with themeState.id
    useEffect(() => {
        if (themeState.id !== selectedId) {
            setSelectedId(themeState.id ?? "");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [themeState.id]);

    const selectedTheme = useMemo(() => (themes).find((t) => t.id === selectedId), [themes, selectedId]);

    // A theme cloned from someone else (has sourceThemeId) cannot be published/unpublished
    const canPublish = selectedTheme ? !selectedTheme.sourceThemeId : false;

    // Determine current UI mode to preview correct styles
    const mode = (themeState.currentMode ?? "light") as "light" | "dark";

    const togglePublic = async () => {
        if (!selectedTheme) return;
        setIsUpdating(true);
        try {
            await updateTheme({
                themeId: selectedTheme.id,
                theme: {
                    name: selectedTheme.name,
                    styles: selectedTheme.styles,
                    public: !selectedTheme.public,
                },
            });
            await refetch();
            queryClient.invalidateQueries({ queryKey: trpc.themes.listPublic.queryKey() });
        } catch (error) {
            console.error("Failed to update theme", error);
            toast.error(t("common.settings.failedToSave"));
        } finally {
            setIsUpdating(false);
        }
    };

    const confirmDelete = async () => {
        if (!selectedTheme) return;
        setIsDeleting(true);
        try {
            await deleteTheme({ themeId: selectedTheme.id });

            // Reset theme to default after deletion
            setThemeState({
                ...defaultThemeState,
                currentMode: themeState.currentMode,
            });

            setSelectedId("");
            await refetch();
            queryClient.invalidateQueries({ queryKey: trpc.themes.listPublic.queryKey() });
            toast.success("Theme deleted");
        } catch (error) {
            console.error("Failed to delete theme", error);
            toast.error(t("common.settings.failedToSave"));
        } finally {
            setIsDeleting(false);
            setConfirmOpen(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="py-0 text-sm font-medium">{t("common.themeEditor.savedThemes")}</p>
                    <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {t("common.themeEditor.themeCount", { count: themes.length })}
                    </span>
                </div>
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
            <div className="flex items-center justify-between">
                <p className="py-0 text-sm font-medium">{t("common.themeEditor.savedThemes")}</p>
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {t("common.themeEditor.themeCount", { count: themes.length })}
                </span>
            </div>

            {/* Saved themes as cards */}
            <div className="grid gap-4 grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
                {themes.map((theme) => (
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
                        <div className="absolute top-2 left-2 rounded-full bg-background/75 backdrop-blur-sm p-1">
                            {theme.public ? (
                                <Globe2 size={12} className="text-muted-foreground" />
                            ) : (
                                <>
                                    <Lock size={12} className="text-muted-foreground" />
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {selectedTheme && (
                <>
                    {/* Theme configuration panel */}
                    <div className="border rounded-md p-4 space-y-4">
                        <p className="text-sm font-medium">{t("common.themeEditor.configurationTitle")}</p>

                        {/* Public / Private toggle */}
                        {canPublish && (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">
                                        {selectedTheme.public ? t("common.themeEditor.publicTheme") : t("common.themeEditor.privateTheme")}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {selectedTheme.public
                                            ? t("common.themeEditor.publicThemeDescription")
                                            : t("common.themeEditor.privateThemeDescription")}
                                    </p>
                                </div>
                                <Switch
                                    checked={selectedTheme.public}
                                    disabled={isUpdating}
                                    onCheckedChange={(checked) => {
                                        if (checked !== selectedTheme.public) {
                                            togglePublic();
                                        }
                                    }}
                                />
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            {/* Reset to default */}
                            {themeState.id && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        applyThemePreset("default");
                                        setSelectedId("");
                                    }}
                                >
                                    {t("common.themeEditor.resetToDefault")}
                                </Button>
                            )}
                            <Link to="/mail/inbox?bgEditor=true">
                                <Button type="button" size="sm" variant="secondary" className="flex items-center gap-1">
                                    <PenLine size={14} /> {t("common.themeEditor.editTheme")}
                                </Button>
                            </Link>
                            {/* Delete */}
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="ml-auto flex items-center gap-1"
                                onClick={() => setConfirmOpen(true)}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 size={14} />
                                )}
                                <span>{isDeleting ? t("common.themeEditor.deletingTheme") : t("common.themeEditor.deleteTheme")}</span>
                            </Button>
                        </div>
                    </div>
                    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                        <DialogContent showOverlay>
                            <DialogHeader>
                                <DialogTitle>{t("common.themeEditor.deleteThemeTitle")}</DialogTitle>
                                <DialogDescription>
                                    {t("common.themeEditor.deleteThemeDescription", { name: selectedTheme?.name })}
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="mt-4">
                                <DialogClose asChild>
                                    <Button variant="secondary" disabled={isDeleting}>
                                        {t("common.actions.cancel")}
                                    </Button>
                                </DialogClose>
                                <Button onClick={confirmDelete} disabled={isDeleting} variant="destructive">
                                    {isDeleting ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" /> {t("common.themeEditor.deletingTheme")}
                                        </span>
                                    ) : (
                                        t("common.themeEditor.deleteTheme")
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </div>
    );
} 