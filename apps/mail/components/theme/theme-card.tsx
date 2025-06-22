export interface ThemeCardProps {
    name: string;
    styles: Record<string, string>;
    selected?: boolean;
    onSelect?: () => void;
}

import { cn } from "@/lib/utils";
import { colorFormatter } from "@/lib/color-converter";
import { useTranslations } from "use-intl";
import { Check } from "lucide-react";

export function ThemeCard({ name, styles, selected, onSelect }: ThemeCardProps) {
    const t = useTranslations();

    // Convert theme colors to CSS format
    const getColor = (key: string) => {
        return colorFormatter(styles[key] ?? "#000", "hsl", "4");
    };

    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                "w-36 group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg transition-all",
                selected && "ring-2 ring-primary"
            )}
            aria-label={t("common.themeEditor.selectThemeAria", { name })}
            aria-pressed={selected}
        >
            <div className="relative">
                {/* Theme preview miniature */}
                <div
                    className="w-full aspect-square rounded-lg p-2 relative overflow-hidden"
                    style={{ backgroundColor: getColor("muted") }}
                >
                    {selected && (
                        <div className="absolute top-1 right-1 bg-background/75 backdrop-blur-sm rounded-full p-0.5">
                            <Check className="w-3 h-3 text-primary" />
                        </div>
                    )}
                    {/* Browser chrome - header */}
                    <div
                        className="rounded-t-md p-2 mb-1"
                        style={{ backgroundColor: getColor("card") }}
                    >
                        <div className="flex gap-1">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getColor("muted-foreground") }}
                            />
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getColor("muted-foreground") }}
                            />
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getColor("muted-foreground") }}
                            />
                        </div>
                    </div>
                    {/* Content area */}
                    <div
                        className="rounded-b-md p-2 h-[calc(100%-2.5rem)] space-y-2"
                        style={{ backgroundColor: getColor("background") }}
                    >
                        <div
                            className="h-2 rounded w-4/5"
                            style={{ backgroundColor: getColor("primary") }}
                        />
                        <div
                            className="h-2 rounded w-3/5"
                            style={{ backgroundColor: getColor("secondary") }}
                        />
                        <div
                            className="h-2 rounded w-4/5"
                            style={{ backgroundColor: getColor("accent") }}
                        />
                        <div
                            className="h-2 rounded w-2/5"
                            style={{ backgroundColor: getColor("primary") }}
                        />
                    </div>
                </div>
            </div>
            {/* Theme name */}
            <p className="mt-2 text-xs font-medium text-center truncate w-full">
                {name}
            </p>
        </button>
    );
} 