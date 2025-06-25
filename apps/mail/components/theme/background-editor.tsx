"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Sparkles, Sun, Moon, X, LayoutDashboard, PanelLeft, List } from "lucide-react";
import { parse, wcagContrast } from "culori";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/store/editor-store";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useQueryState } from "nuqs";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";

// Keys that can be targeted for background edits
type TargetKey = "background" | "sidebar" | "mailPanel" | "threadPanel" | "all";

type ThemeMode = "auto" | "light" | "dark";

interface ColorCircle {
    id: string;
    x: number;
    y: number;
    size: number;
}

// Convert HSV to RGB
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0,
        g = 0,
        b = 0;
    if (0 <= h && h < 60) {
        r = c;
        g = x;
        b = 0;
    } else if (60 <= h && h < 120) {
        r = x;
        g = c;
        b = 0;
    } else if (120 <= h && h < 180) {
        r = 0;
        g = c;
        b = x;
    } else if (180 <= h && h < 240) {
        r = 0;
        g = x;
        b = c;
    } else if (240 <= h && h < 300) {
        r = x;
        g = 0;
        b = c;
    } else if (300 <= h && h < 360) {
        r = c;
        g = 0;
        b = x;
    }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

// Convert RGB to HSV
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    let h = 0;
    if (diff !== 0) {
        if (max === r) {
            h = ((g - b) / diff) % 6;
        } else if (max === g) {
            h = (b - r) / diff + 2;
        } else {
            h = (r - g) / diff + 4;
        }
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    const s = max === 0 ? 0 : diff / max;
    const v = max;
    return [h, s, v];
}

// Convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
}

// Convert RGB to Hex
function rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Determine whether a colour is light or dark and return white/black for contrast
function getContrastingTextColor(hex: string): string {
    const bg = parse(hex);
    if (!bg) return "#000000";
    const white = parse("#ffffff")!;
    const black = parse("#000000")!;
    const contrastWithWhite = wcagContrast(bg, white);
    const contrastWithBlack = wcagContrast(bg, black);
    return contrastWithWhite >= contrastWithBlack ? "#FFFFFF" : "#000000";
}

interface DesignControlsProps {
    borderRadius: number;
    borderColor: string;
    primaryColor: string;
    onBorderRadiusChange: (v: number) => void;
    onBorderColorChange: (v: string) => void;
    onPrimaryColorChange: (v: string) => void;
    theme: ThemeMode;
}

interface BackgroundEditorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BackgroundEditorDialog({ open, onOpenChange }: BackgroundEditorDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showOverlay={true} className="max-w-6xl rounded-2xl p-0 shadow-xl">
                <DialogHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
                    <DialogTitle>Edit Background</DialogTitle>
                    <DialogClose asChild>
                        <Button size="icon" variant="ghost">
                            <span className="sr-only">Close</span>
                            ✕
                        </Button>
                    </DialogClose>
                </DialogHeader>
                <div className="max-h-[80vh] overflow-y-auto">
                    <BackgroundEditor />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function BackgroundEditor() {
    const [targetProperty, setTargetProperty] = useState<TargetKey>("background");

    // Theme store
    const { themeState, setThemeState } = useEditorStore();
    const currentMode = themeState.currentMode;

    // Local editing mode (auto/light/dark)
    const [selectedTheme, setSelectedTheme] = useState<ThemeMode>("light");

    // Design control states, initialised from theme
    const [borderRadius, setBorderRadius] = useState<number>(() =>
        parseFloat(themeState.styles.light.radius.replace("rem", "")),
    );
    const [borderColor, setBorderColor] = useState<string>(() => themeState.styles.light.border ?? "#e5e7eb");
    const [primaryColor, setPrimaryColor] = useState<string>(() => themeState.styles.light.primary);

    const [circles, setCircles] = useState<ColorCircle[]>([{ id: "1", x: 75, y: 65, size: 80 }]);
    const [draggedCircle, setDraggedCircle] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [gradientDirection, setGradientDirection] = useState<number>(135);

    // Per-target slider values
    type SliderValues = { opacity: number; intensity: number; brightness: number };
    const defaultSlider: SliderValues = { opacity: 100, intensity: 100, brightness: 90 };
    const [sliderValues, setSliderValues] = useState<Record<TargetKey, SliderValues>>({
        background: { ...defaultSlider },
        sidebar: { ...defaultSlider },
        mailPanel: { ...defaultSlider },
        threadPanel: { ...defaultSlider },
        all: { ...defaultSlider },
    });

    const { opacity, intensity, brightness } = sliderValues[targetProperty];

    const canvasRef = useRef<HTMLDivElement>(null);

    /* -------------------- Color Helpers ------------------- */
    const presetColors = [
        "#f5f5dc",
        "#ec4899",
        "#8b5cf6",
        "#ef4444",
        "#f97316",
        "#eab308",
        "#22c55e",
        "#06b6d4",
        "#3b82f6",
        "#64748b",
    ];

    const getColorFromPosition = useCallback((x: number, y: number): string => {
        const hue = (x / 100) * 360;
        let saturation = Math.max(0.1, 1 - y / 100);
        saturation = Math.min(1, Math.max(0, saturation * (intensity / 100)));
        const value = Math.min(1, Math.max(0, brightness / 100));
        const [r, g, b] = hsvToRgb(hue, saturation, value);
        return rgbToHex(r, g, b);
    }, [intensity, brightness]);

    const getPositionFromColor = useCallback((color: string): { x: number; y: number } => {
        const [r, g, b] = hexToRgb(color);
        const [h, s] = rgbToHsv(r, g, b);
        const x = (h / 360) * 100;
        const y = (1 - s) * 100;
        return { x, y };
    }, []);

    const generateGradient = useCallback(() => {
        if (circles.length === 1) {
            return getColorFromPosition(circles[0].x, circles[0].y);
        }
        const sortedCircles = [...circles].sort((a, b) => a.x - b.x);
        const colorStops = sortedCircles
            .map((circle) => {
                const color = getColorFromPosition(circle.x, circle.y);
                const position = Math.round((circle.x / 100) * 100);
                return `${color} ${position}%`;
            })
            .join(", ");
        return `linear-gradient(${gradientDirection}deg, ${colorStops})`;
    }, [circles, gradientDirection, getColorFromPosition]);

    /* -------------------- Drag logic ------------------- */
    const updateCirclePosition = useCallback(
        (clientX: number, clientY: number) => {
            if (!draggedCircle || !canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const x = ((clientX - rect.left) / rect.width) * 100;
            const y = ((clientY - rect.top) / rect.height) * 100;
            setCircles((prev) =>
                prev.map((circle) =>
                    circle.id === draggedCircle
                        ? { ...circle, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) }
                        : circle,
                ),
            );
        },
        [draggedCircle],
    );

    const handleMouseDown = useCallback((circleId: string, e: React.MouseEvent) => {
        e.preventDefault();
        setDraggedCircle(circleId);
        setIsDragging(true);
    }, []);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isDragging || !draggedCircle) return;
            updateCirclePosition(e.clientX, e.clientY);
        },
        [isDragging, draggedCircle, updateCirclePosition],
    );

    const handleMouseUp = useCallback(() => {
        setDraggedCircle(null);
        setIsDragging(false);
    }, []);

    const removeCircle = useCallback(
        (circleId: string) => {
            if (circles.length <= 1) return;
            setCircles((prev) => prev.filter((circle) => circle.id !== circleId));
        },
        [circles.length],
    );

    const resetCircles = useCallback(() => {
        setCircles([{ id: "1", x: 75, y: 65, size: 80 }]);
    }, []);

    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!isDragging || !draggedCircle) return;
            updateCirclePosition(e.clientX, e.clientY);
        };
        const handleGlobalMouseUp = () => {
            setDraggedCircle(null);
            setIsDragging(false);
        };
        if (isDragging) {
            document.addEventListener("mousemove", handleGlobalMouseMove, { passive: false });
            document.addEventListener("mouseup", handleGlobalMouseUp);
        }
        return () => {
            document.removeEventListener("mousemove", handleGlobalMouseMove);
            document.removeEventListener("mouseup", handleGlobalMouseUp);
        };
    }, [isDragging, draggedCircle, updateCirclePosition]);

    const handleColorSelect = (color: string) => {
        if (circles.length > 0) {
            const position = getPositionFromColor(color);
            setCircles((prev) =>
                prev.map((circle, index) => (index === 0 ? { ...circle, x: position.x, y: position.y } : circle)),
            );
        }
    };

    /* -------------------- Theme Helpers ------------------- */
    const getThemeStyles = () => {
        switch (selectedTheme) {
            case "dark":
                return {
                    border: "border-slate-600/30",
                    text: "text-white",
                    overlay: "rgba(0,0,0,0.15)",
                    canvasBackground: "rgba(0,0,0,0.1)",
                };
            case "light":
                return {
                    border: "border-slate-300/30",
                    text: "text-slate-800",
                    overlay: "rgba(100,116,139,0.15)",
                    canvasBackground: "rgba(248,250,252,0.8)",
                };
            default:
                return {
                    border: "border-slate-500/30",
                    text: "text-white",
                    overlay: "rgba(128,128,128,0.15)",
                    canvasBackground: "rgba(128,128,128,0.1)",
                };
        }
    };
    const themeStyles = getThemeStyles();

    /* -------------------- Derived values ------------------- */
    const currentColor = circles.length > 0 ? getColorFromPosition(circles[0].x, circles[0].y) : "#f5f5dc";
    const currentGradient = generateGradient();
    const isGradient = circles.length > 1;

    /* -------------------- Update Theme Store ------------------- */
    useEffect(() => {
        const applyOpacity = (hex: string) => {
            if (opacity >= 100) return hex;
            const alpha = Math.round((opacity / 100) * 255)
                .toString(16)
                .padStart(2, "0");
            return `${hex}${alpha}`;
        };

        const backgroundValue = isGradient
            ? currentGradient.replace(/#([0-9a-fA-F]{6})/g, (m) => applyOpacity(m))
            : applyOpacity(currentColor);
        const textColor = isGradient ? undefined : getContrastingTextColor(currentColor);
        const modeToUpdate = selectedTheme === "auto" ? currentMode : selectedTheme;
        setThemeState({
            ...themeState,
            styles: {
                ...themeState.styles,
                [modeToUpdate]: {
                    ...themeState.styles[modeToUpdate],
                    ...(targetProperty === "all"
                        ? {
                            background: backgroundValue,
                            sidebar: backgroundValue,
                            mailPanel: backgroundValue,
                            threadPanel: backgroundValue,
                            foreground: textColor ?? themeState.styles[modeToUpdate].foreground,
                            "sidebar-foreground": textColor ?? themeState.styles[modeToUpdate]["sidebar-foreground"],
                            "mailPanel-foreground": textColor ?? (themeState.styles as any)[modeToUpdate]["mailPanel-foreground"],
                        }
                        : {
                            [targetProperty]: backgroundValue,
                            ...(textColor && targetProperty === "background" && { foreground: textColor }),
                            ...(textColor && targetProperty === "sidebar" && { "sidebar-foreground": textColor }),
                            ...(textColor && targetProperty === "mailPanel" && { "mailPanel-foreground": textColor }),
                        }),
                },
            },
        });
    }, [currentColor, currentGradient, isGradient, selectedTheme, targetProperty, opacity]);

    // Apply border radius, border color, and primary color changes
    useEffect(() => {
        const foregroundForPrimary = getContrastingTextColor(primaryColor);
        const commonUpdates = {
            radius: `${borderRadius}rem`,
            border: borderColor,
            primary: primaryColor,
            "primary-foreground": foregroundForPrimary,
        } as const;

        setThemeState({
            ...themeState,
            styles: {
                ...themeState.styles,
                light: { ...themeState.styles.light, ...commonUpdates },
                dark: { ...themeState.styles.dark, ...commonUpdates },
            },
        });
    }, [borderRadius, borderColor, primaryColor]);

    /* -------------------- Body background preview ------------------- */
    useEffect(() => {
        if (targetProperty !== "background") return;
        const background = isGradient ? currentGradient : currentColor;
        document.body.style.background = isGradient
            ? `${background.replace(/linear-gradient\([^,]+,/, "linear-gradient(135deg,")}40`
            : `linear-gradient(135deg, ${background}40, ${background}20)`;
        return () => {
            if (targetProperty === "background") {
                document.body.style.background = "";
            }
        };
    }, [currentColor, currentGradient, isGradient, targetProperty]);

    // When target property changes, update circles to reflect its current color (for solid colors)
    useEffect(() => {
        if (targetProperty === "all") return;
        const modeToRead = selectedTheme === "auto" ? currentMode : selectedTheme;
        const styleValue = (themeState.styles as any)[modeToRead]?.[targetProperty];
        if (!styleValue || styleValue.includes("gradient")) return;
        const { x, y } = getPositionFromColor(styleValue);
        setCircles([{ id: "1", x, y, size: 80 }]);
    }, [targetProperty, selectedTheme, currentMode]);

    /* -------------------- Render ------------------- */
    return (
        <Tabs defaultValue="background" className="w-full">
            <TabsList className="flex justify-center mb-0 bg-transparent">
                <TabsTrigger value="background">Background</TabsTrigger>
                <TabsTrigger value="others">Others</TabsTrigger>
            </TabsList>
            {/* ---------------- Background Tab ---------------- */}
            <TabsContent value="background">
                <div className="flex flex-wrap items-start justify-center gap-6 p-0">
                    {/* Picker Area */}
                    <div
                        className={cn(
                            "relative h-[600px] w-full max-w-sm overflow-hidden rounded-3xl border backdrop-blur-xl p-6 transition-all duration-500",
                            themeStyles.border,
                            isDragging && "select-none",
                        )}
                        style={{ background: "rgba(255,255,255,0.1)" }}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {/* Pattern overlay */}
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundImage: `radial-gradient(circle, ${themeStyles.overlay} 1px, transparent 1px)`,
                                backgroundSize: "12px 12px",
                            }}
                        />


                        {/* Target variable selection */}
                        <div className="relative z-10 mb-6 flex items-center justify-center gap-2">
                            {([
                                {
                                    key: "background",
                                    label: "App",
                                    icon: <LayoutDashboard className="h-4 w-4" />,
                                },
                                {
                                    key: "sidebar",
                                    label: "Sidebar",
                                    icon: <PanelLeft className="h-4 w-4" />,
                                },
                                {
                                    key: "mailPanel",
                                    label: "Mail List",
                                    icon: <List className="h-4 w-4" />,
                                },
                                // {
                                //     key: "all",
                                //     label: "All",
                                //     icon: <Layers className="h-4 w-4" />,
                                // },
                            ] as { key: TargetKey; label: string; icon: React.ReactNode }[]).map(({ key, label, icon }) => (
                                <Button
                                    key={key}
                                    variant={targetProperty === key ? "secondary" : "ghost"}
                                    size="sm"
                                    className={cn("flex items-center gap-1 bg-transparent text-black hover:bg-black/10 hover:text-black", targetProperty === key && "bg-black/10 hover:bg-black/10 hover:text-black")}
                                    onClick={() => setTargetProperty(key)}
                                >
                                    {icon}
                                    {label}
                                </Button>
                            ))}
                        </div>
                        <div className="relative z-10 mb-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <label className="text-xs w-16">Intensity</label>
                                <input
                                    type="range"
                                    min={0}
                                    max={200}
                                    value={intensity}
                                    onChange={(e) => setSliderValues((prev) => ({ ...prev, [targetProperty]: { ...prev[targetProperty], intensity: Number(e.target.value) } }))}
                                    className="flex-1"
                                />
                                <span className="w-10 text-right text-xs">{intensity}%</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="text-xs w-16">Brightness</label>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={brightness}
                                    onChange={(e) => setSliderValues((prev) => ({ ...prev, [targetProperty]: { ...prev[targetProperty], brightness: Number(e.target.value) } }))}
                                    className="flex-1"
                                />
                                <span className="w-10 text-right text-xs">{brightness}%</span>
                            </div>
                        </div>

                        {/* Canvas */}
                        <div
                            ref={canvasRef}
                            className={cn(
                                "relative mb-6 h-72 flex-1 overflow-hidden rounded-2xl",
                                isDragging ? "cursor-grabbing" : "cursor-crosshair",
                            )}
                            style={{ backgroundColor: themeStyles.canvasBackground, backdropFilter: "blur(10px)" }}
                        >
                            {circles.map((circle) => (
                                <div
                                    key={circle.id}
                                    className={cn(
                                        "absolute rounded-full border-4 border-white shadow-lg",
                                        draggedCircle === circle.id
                                            ? "z-10 scale-110 cursor-grabbing shadow-xl"
                                            : "cursor-grab transition-all duration-150 hover:scale-105 hover:shadow-xl",
                                    )}
                                    style={{
                                        width: circle.size,
                                        height: circle.size,
                                        left: `${circle.x}%`,
                                        top: `${circle.y}%`,
                                        transform: "translate(-50%, -50%)",
                                        backgroundColor: getColorFromPosition(circle.x, circle.y),
                                    }}
                                    onMouseDown={(e) => handleMouseDown(circle.id, e)}
                                    onDoubleClick={() => removeCircle(circle.id)}
                                />
                            ))}
                        </div>

                        {/* Preset colors */}
                        <div className="relative z-10 mb-6 flex items-center justify-center gap-1">
                            {presetColors.map((color) => (
                                <button
                                    key={color}
                                    className="h-6 w-6 rounded-full border-2 border-transparent transition-all hover:border-white/40 hover:scale-105"
                                    style={{ backgroundColor: color }}
                                    onClick={() => handleColorSelect(color)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </TabsContent>

            {/* ---------------- Others Tab ---------------- */}
            <TabsContent value="others">
                <DesignControls
                    borderRadius={borderRadius}
                    borderColor={borderColor}
                    primaryColor={primaryColor}
                    onBorderRadiusChange={setBorderRadius}
                    onBorderColorChange={setBorderColor}
                    onPrimaryColorChange={setPrimaryColor}
                    theme={selectedTheme}
                />
            </TabsContent>
        </Tabs>
    );
}

export function useBackgroundEditor() {
    const [openQuery, setOpenQuery] = useQueryState('bgEditor');
    const open = openQuery === 'true';

    const setOpen = (state: boolean) => {
        if (state) {
            setOpenQuery('true').catch(console.error);
        } else {
            setOpenQuery(null).catch(console.error);
        }
    };

    const toggleOpen = () => setOpen(!open);

    return { open, setOpen, toggleOpen } as const;
}

export function BackgroundEditorPopup() {
    const { open, setOpen } = useBackgroundEditor();

    if (!open) return null;

    return (
        <div
            tabIndex={0}
            className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-0 opacity-40 backdrop-blur-sm transition-opacity duration-150 hover:opacity-100 sm:inset-auto sm:bottom-4 sm:right-4 sm:flex-col sm:items-end sm:justify-end sm:p-0 rounded-2xl focus:opacity-100"
        >
            <div className="bg-white dark:bg-panelDark overflow-hidden rounded-2xl border border-[#E7E7E7] shadow-lg dark:border-[#252525] w-[600px] max-w-[90vw] sm:w-[400px]">
                <div className="flex w-full flex-col h-[90vh] sm:h-[600px] sm:max-h-[85vh]">
                    {/* <BackgroundEditorHeader onClose={() => setOpen(false)} /> */}
                    <div className="relative flex-1 overflow-auto">
                        <BackgroundEditor />
                    </div>
                </div>
            </div>
        </div>
    );
}

export const BackgroundEditorToggleButton = () => {
    const { open, toggleOpen } = useBackgroundEditor();

    return (
        !open && (
            <div className="fixed bottom-4 right-20 z-50"> {/* offset to avoid AI toggle button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="dark:bg-sidebar border h-12 w-12 rounded-lg"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleOpen();
                            }}
                        >
                            <Sparkles className="h-5 w-5 dark:text-white text-black" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit background</TooltipContent>
                </Tooltip>
            </div>
        )
    );
};

// -------------------- Design Controls ------------------- //
function DesignControls({
    borderRadius,
    borderColor,
    primaryColor,
    onBorderRadiusChange,
    onBorderColorChange,
    onPrimaryColorChange,
    theme: _theme,
}: DesignControlsProps) {
    return (
        <div className="space-y-8 max-w-sm mx-auto p-4">
            {/* Radius */}
            <div className="space-y-3 text-black">
                <label className="text-sm font-medium">Border Radius</label>
                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min={0}
                        max={2}
                        step={0.125}
                        value={borderRadius}
                        onChange={(e) => onBorderRadiusChange(parseFloat(e.target.value))}
                        className="flex-1 accent-primary"
                    />
                    <span className="w-14 text-right text-sm tabular-nums">
                        {borderRadius.toFixed(2)}rem
                    </span>
                </div>
            </div>
            {/* Border Color */}
            <div className="space-y-3">
                <label className="text-sm text-black font-medium">Border Color</label>
                <div className="flex items-center gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                className="h-10 w-10 rounded-md border shadow-sm"
                                style={{ backgroundColor: borderColor }}
                                aria-label="Pick border color"
                            />
                        </PopoverTrigger>
                        <PopoverContent side="right" align="start" className="w-auto p-4">
                            <HexColorPicker color={borderColor} onChange={onBorderColorChange} />
                        </PopoverContent>
                    </Popover>
                    <Input
                        className="flex-1 h-10 text-sm"
                        value={borderColor}
                        onChange={(e) => onBorderColorChange(e.target.value)}
                    />
                </div>
            </div>
            {/* Primary Color */}
            <div className="space-y-3">
                <label className="text-sm text-black font-medium">Primary Color</label>
                <div className="flex items-center gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                className="h-10 w-10 rounded-md border shadow-sm"
                                style={{ backgroundColor: primaryColor }}
                                aria-label="Pick primary color"
                            />
                        </PopoverTrigger>
                        <PopoverContent side="right" align="start" className="w-auto p-4">
                            <HexColorPicker color={primaryColor} onChange={onPrimaryColorChange} />
                        </PopoverContent>
                    </Popover>
                    <Input
                        className="flex-1 h-10 text-sm"
                        value={primaryColor}
                        onChange={(e) => onPrimaryColorChange(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
} 