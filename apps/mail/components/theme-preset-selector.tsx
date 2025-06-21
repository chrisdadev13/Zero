"use client";

import { Badge } from "@/components/ui/badge";
import { useEditorStore } from "@/store/editor-store";
import { defaultPresets } from "../lib/theme-presets";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { colorFormatter } from "../lib/color-converter";

export function ThemePresetSelector() {
    const { themeState, applyThemePreset } = useEditorStore();
    const mode = themeState.currentMode;
    const presetNames = Object.keys(defaultPresets);

    const ColorBox = ({ color }: { color: string }) => (
        <div
            className="h-3 w-3 rounded-sm border"
            style={{ backgroundColor: colorFormatter(color, "hsl", "4") }}
        />
    );

    return (
        <div className="space-y-4">
            <Badge variant="secondary" className="px-3 py-1.5">
                Theme Preset
            </Badge>

            <Select
                onValueChange={(val) => applyThemePreset(val)}
                defaultValue={themeState.preset ?? "modern-minimal"}
            >
                <SelectTrigger className="w-64 capitalize">
                    <SelectValue placeholder="Select preset" />
                </SelectTrigger>
                <SelectContent className="w-64">
                    {presetNames.map((name) => {
                        const styles = defaultPresets[name].styles[mode];
                        return (
                            <SelectItem key={name} value={name} className="capitalize">
                                <div className="flex items-center gap-2">
                                    <ColorBox color={styles.primary ?? "#000"} />
                                    <ColorBox color={styles.secondary ?? "#000"} />
                                    <ColorBox color={styles.accent ?? "#000"} />
                                    {name.replace(/-/g, " ")}
                                </div>
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
        </div>
    );
}