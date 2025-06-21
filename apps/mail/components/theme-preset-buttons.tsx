import { Button } from "@/components/ui/button";
import { getPresetThemeStyles } from "../lib/theme-preset-helper";
import { cn } from "../lib/is-deep-equal";
import { colorFormatter } from "../lib/color-converter";
import type { ThemeEditorState } from "../lib/theme-editor";

// ColorBox component remains internal to ThemePresetButtons
const ColorBox = ({ color }: { color: string }) => {
    return (
        <div
            className="w-3 h-3 rounded-sm border"
            style={{ backgroundColor: color }}
        />
    );
};

interface ThemePresetButtonsProps {
    presetNames: string[];
    mode: "light" | "dark";
    themeState: ThemeEditorState;
    applyThemePreset: (presetName: string) => void;
}

export function ThemePresetButtons({
    presetNames,
    mode,
    themeState,
    applyThemePreset,
}: ThemePresetButtonsProps) {
    // Use the intended slice of presets
    const presetsToShow = presetNames || [];
    const numUniquePresets = presetsToShow.length;

    // Avoid rendering if no presets
    if (numUniquePresets === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {presetsToShow.map((presetName) => {
                const themeStyles = getPresetThemeStyles(presetName)[mode];
                const bgColor = colorFormatter(themeStyles.primary, "hsl", "4");
                const isSelected = presetName === themeState.preset;

                return (
                    <Button
                        key={presetName}
                        variant="ghost"
                        className={cn(
                            "flex aspect-square w-full items-center justify-center flex-col gap-2 p-3 border rounded-sm transition-colors",
                            isSelected ? "ring-2 ring-primary" : ""
                        )}
                        style={{
                            backgroundColor: bgColor
                                .replace("hsl", "hsla")
                                .replace(/\s+/g, ", ")
                                .replace(")", ", 0.10)"),
                            color: themeStyles.foreground,
                        }}
                        onClick={() => applyThemePreset(presetName)}
                    >
                        <div className="flex gap-1 mb-2">
                            <ColorBox color={themeStyles.primary} />
                            <ColorBox color={themeStyles.secondary} />
                            <ColorBox color={themeStyles.accent} />
                        </div>
                        <span className="text-sm capitalize">
                            {presetName.replace(/-/g, " ")}
                        </span>
                    </Button>
                );
            })}
        </div>
    );
}