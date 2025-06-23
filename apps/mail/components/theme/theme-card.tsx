export interface ThemeCardProps {
    name: string;
    styles: Record<string, string>;
    selected?: boolean;
    onSelect?: () => void;
}

import { cn } from "@/lib/utils";
import { colorFormatter } from "@/lib/color-converter";
import { useTranslations } from "use-intl";
import { Check, Edit3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router";

export function ThemeCard({ name, styles, selected, onSelect }: ThemeCardProps) {
    const t = useTranslations();

    // Convert theme colors to CSS format
    const getColor = (key: string) => {
        return colorFormatter(styles[key] ?? "#000", "hsl", "4");
    };

    // Build an array of colors to preview – pick common tokens if available
    const colorKeys = [
        "primary",
        "secondary",
        "accent",
        "foreground",
    ].filter((k) => styles[k]);

    const colors = colorKeys.map((k) => getColor(k));

    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                "relative group cursor-pointer transition-all duration-200 w-36 rounded-lg focus:outline-none",
                selected
                    ? "ring-2 ring-primary ring-offset-2"
                    : "hover:ring-2 hover:ring-gray-300 hover:ring-offset-2",
            )}
            aria-label={t("common.themeEditor.selectThemeAria", { name })}
            aria-pressed={selected}
        >
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    {/* Theme Preview */}
                    <div className="aspect-[4/3] bg-white p-4 relative">
                        {/* Window Controls */}
                        <div className="flex gap-1 mb-3">
                            <div className="h-2 w-2 rounded-full bg-red-400" />
                            <div className="h-2 w-2 rounded-full bg-yellow-400" />
                            <div className="h-2 w-2 rounded-full bg-green-400" />
                        </div>

                        {/* Color Bars */}
                        <div className="space-y-2">
                            {colors.map((c, idx) => (
                                <div
                                    key={idx}
                                    className="h-2 rounded"
                                    style={{ backgroundColor: c, width: `${100 - idx * 20}%` }}
                                />
                            ))}
                        </div>

                        {/* Selection Indicator */}
                        {selected && (
                            <div className="absolute top-2 right-2 rounded-full bg-primary p-1 text-white">
                                <Check className="h-3 w-3" />
                            </div>
                        )}
                    </div>

                    {/* Theme Name */}
                    <div className="border-t p-3">
                        <div className="flex items-center justify-between">
                            <span className="truncate text-sm font-medium">{name}</span>
                            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">

                                <Link to="editor">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-muted">
                                        <Edit3 className="h-3 w-3" />
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </button>
    );
} 