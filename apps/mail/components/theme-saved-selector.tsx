"use client";

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
import { Globe2, Lock } from "lucide-react";

export function UserThemeSelector() {
    const trpc = useTRPC();
    const { themeState, setThemeState } = useEditorStore();

    const { data: themes = [], refetch } = useQuery(trpc.themes.list.queryOptions());
    const queryClient = useQueryClient();

    const { mutateAsync: updateTheme } = useMutation(trpc.themes.update.mutationOptions());

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
    };

    return (
        <div className="space-y-4">
            <p className="py-0 text-sm font-medium">Saved Themes</p>

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
                    <SelectValue placeholder="Select theme" />
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
                        {selectedTheme.public ? "Public" : "Private"}
                    </span>
                </div>
            )}
        </div>
    );
} 