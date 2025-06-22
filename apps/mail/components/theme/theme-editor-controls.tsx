import { useEditorStore } from "@/store/editor-store";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import * as culori from "culori";
import { AlertTriangle } from "lucide-react";
import { COMMON_STYLES } from "@/config/theme";
import { useTranslations } from "use-intl";
import type { ThemeStyles } from "@/lib/themes";

const COLOR_KEYS: string[] = [
    "background",
    "foreground",
    "primary",
    "secondary",
    "accent",
    "border",
    "primary-foreground",
    "secondary-foreground",
    "accent-foreground",
];

const FONT_KEY = "font-sans";

const FONT_OPTIONS: { label: string; value: string }[] = [
    { label: "System Sans", value: "ui-sans-serif, system-ui" },
    { label: "Inter", value: "Inter, sans-serif" },
    { label: "Roboto", value: "Roboto, sans-serif" },
    { label: "Open Sans", value: "'Open Sans', sans-serif" },
    { label: "Lato", value: "Lato, sans-serif" },
    { label: "Poppins", value: "Poppins, sans-serif" },
    { label: "Georgia (Serif)", value: "Georgia, serif" },
    { label: "Times New Roman", value: "'Times New Roman', serif" },
    { label: "Menlo (Mono)", value: "Menlo, monospace" },
    { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
];

const CONTRAST_PAIR: Record<string, string> = {
    background: "foreground",
    foreground: "background",
    primary: "primary-foreground",
    "primary-foreground": "primary",
    secondary: "secondary-foreground",
    "secondary-foreground": "secondary",
    accent: "accent-foreground",
    "accent-foreground": "accent",
};

function getLuminance(colorStr: string): number {
    try {
        const parsed = culori.parse(colorStr);
        if (!parsed) return 0;
        // Convert to RGB in linear space (values 0..1)
        const rgb = culori.converter("rgb")(parsed) as unknown as { r: number; g: number; b: number };
        const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
            const channel = v;
            return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    } catch (err) {
        console.error("Failed to compute luminance for", colorStr, err);
        return 0;
    }
}

function getContrastRatio(colA: string, colB: string): number {
    let L1 = getLuminance(colA);
    let L2 = getLuminance(colB);
    if (L1 < L2) [L1, L2] = [L2, L1];
    return (L1 + 0.05) / (L2 + 0.05);
}

export default function ThemeEditorControls() {
    const { themeState, setThemeState } = useEditorStore();
    const mode = themeState.currentMode;
    const t = useTranslations();

    const handleChange = (key: string, value: string) => {
        // If key is common style, update both light & dark
        if (COMMON_STYLES.includes(key as (typeof COMMON_STYLES)[number])) {
            setThemeState({
                ...themeState,
                styles: {
                    ...themeState.styles,
                    light: {
                        ...(themeState.styles.light),
                        [key]: value,
                    },
                    dark: {
                        ...(themeState.styles.dark),
                        [key]: value,
                    },
                },
            });
        } else {
            setThemeState({
                ...themeState,
                styles: {
                    ...themeState.styles,
                    [mode]: {
                        ...themeState.styles[mode],
                        [key]: value,
                    },
                },
            });
        }
    };

    return (
        <div className="space-y-8">
            {/* Color section */}
            <div className="space-y-4">
                <Badge variant="secondary" className="px-3 py-1.5 capitalize">
                    {t("common.themeEditor.colorsTitle", { mode })}
                </Badge>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {COLOR_KEYS.map((k) => {
                        const currentValue = (themeState.styles)[mode][k as keyof ThemeStyles[typeof mode]] ?? "#ffffff";
                        const pairKey = CONTRAST_PAIR[k];
                        let lowContrast = false;
                        if (pairKey) {
                            const pairVal = (themeState.styles)[mode][pairKey as keyof ThemeStyles[typeof mode]] ?? "#fff";
                            const ratio = getContrastRatio(currentValue, pairVal);
                            lowContrast = ratio < 3; // WCAG AA for large text is 3
                        }

                        return (
                            <div key={k} className="flex items-center gap-3">
                                <label className="w-32 text-sm capitalize" htmlFor={`color-${k}`}>
                                    {k.replace(/-/g, " ")}
                                </label>
                                <input
                                    id={`color-${k}`}
                                    type="color"
                                    value={currentValue}
                                    onChange={(e) => handleChange(k, e.target.value)}
                                    className="h-8 w-10 border rounded"
                                />
                                <Input
                                    className="flex-1"
                                    value={currentValue}
                                    onChange={(e) => handleChange(k, e.target.value)}
                                />
                                {lowContrast && (
                                    <span title={t("common.themeEditor.lowContrast")}>
                                        <AlertTriangle className="h-4 w-4 text-red-500" />
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Font section */}
            {/* <div className="space-y-4">
                <Badge variant="secondary" className="px-3 py-1.5 capitalize">
                    Font family
                </Badge>
                <Select
                    defaultValue={(themeState.styles.light as any)[FONT_KEY] ?? ""}
                    onValueChange={(v) => {
                        handleChange(FONT_KEY, v);
                        document.body.style.fontFamily = v;
                    }}
                >
                    <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                        {FONT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                <span style={{ fontFamily: opt.value }}>{opt.label}</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div> */}

            {/* Radius section */}
            <div className="space-y-4">
                <Badge variant="secondary" className="px-3 py-1.5 capitalize">
                    {t("common.themeEditor.radiusLabel")}
                </Badge>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min={0}
                        max={2}
                        step={0.125}
                        value={parseFloat(themeState.styles.light.radius.replace("rem", ""))}
                        onChange={(e) => handleChange("radius", `${e.target.value}rem`)}
                    />
                    <span className="w-12 text-sm">{themeState.styles.light.radius}</span>
                </div>
            </div>
        </div>
    );
} 