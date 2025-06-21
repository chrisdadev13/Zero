"use client";

import { useTRPC } from "@/providers/query-provider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useEditorStore } from "@/store/editor-store";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export function UserThemeSelector() {
    const trpc = useTRPC();
    const { themeState, setThemeState } = useEditorStore();

    const { data: themes = [] } = useQuery(trpc.themes.list.queryOptions());

    const [selectedId, setSelectedId] = useState<string>("");

    return (
        <div className="space-y-4">
            <p className="px-3 py-0 text-sm font-medium">
                Saved Themes
            </p>
            <Select
                value={selectedId}
                onValueChange={(val) => {
                    setSelectedId(val);
                    const selected = (themes as any[]).find((t) => t.id === val);
                    if (selected) {
                        setThemeState({
                            ...themeState,
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
                        <SelectItem key={theme.id} value={theme.id} className={cn("capitalize")}>
                            {theme.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
} 