import { useTRPC } from "@/providers/query-provider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useEditorStore } from "@/store/editor-store";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Globe2, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button";

export function UserThemeSelector() {
    const trpc = useTRPC();
    const { themeState, setThemeState } = useEditorStore();
    const t = useTranslations();

    const { data: themes = [], refetch } = useQuery(trpc.themes.list.queryOptions());
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

    const selectedTheme = useMemo(() => (themes as any[]).find((t) => t.id === selectedId), [themes, selectedId]);

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

    return (
        <div className="space-y-4">
            <p className="py-0 text-sm font-medium">{t("common.themeEditor.savedThemes")}</p>

            <Select
                value={selectedId}
                onValueChange={(val) => {
                    setSelectedId(val);
                    const selected = (themes as any[]).find((t) => t.id === val);
                    if (selected) {
                        setThemeState({
                            ...themeState,
                            id: selected.id,
                            styles: selected.styles as any,
                            preset: undefined,
                        });
                    }
                }}
            >
                <SelectTrigger className="w-64 capitalize">
                    <SelectValue placeholder={t("common.themeEditor.selectTheme")} />
                </SelectTrigger>
                <SelectContent className="w-64">
                    {(themes as any[]).map((theme) => (
                        <SelectItem key={theme.id} value={theme.id} className={cn("capitalize flex items-center gap-2")}>
                            {theme.name}
                            {theme.public ? <Globe2 size={14} className="text-muted-foreground" /> : <Lock size={14} className="text-muted-foreground" />}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

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