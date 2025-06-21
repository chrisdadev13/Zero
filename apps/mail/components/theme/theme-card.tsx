export interface ThemeCardProps {
    name: string;
    styles: Record<string, string>;
    selected?: boolean;
    onSelect?: () => void;
}

import { cn } from "@/lib/utils";
import { colorFormatter } from "@/lib/color-converter";
import { useTranslations } from "use-intl";

export function ThemeCard({ name, styles, selected, onSelect }: ThemeCardProps) {
    const t = useTranslations();

    // Pick a handful of representative colors to preview the theme.
    const previewKeys = [
        "primary",
        "secondary",
        "accent",
        "muted",
        "background",
    ];

    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                "bg-card hover:bg-secondary/50 text-card-foreground w-full rounded-lg border p-4 shadow-sm transition-colors",
                selected && "ring-2 ring-primary"
            )}
            aria-label={t("common.themeEditor.selectThemeAria", { name })}
            aria-pressed={selected}
        >
            <span className="block text-center text-base font-semibold capitalize mb-3">
                {name.replace(/-/g, " ")}
            </span>
            <div className="space-y-1">
                {previewKeys.map((key) => (
                    <div
                        key={key}
                        className="h-3 w-full rounded-sm border"
                        style={{ backgroundColor: colorFormatter(styles[key] ?? "#000", "hsl", "4") }}
                    />
                ))}
            </div>
            {
                /* TODO: Add Creator username or something */
            }
        </button>
    );
} 