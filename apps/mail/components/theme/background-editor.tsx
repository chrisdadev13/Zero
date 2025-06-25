"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, LayoutDashboard, PanelLeft, List, Circle, Square, Palette, Type as TypeIcon, Sun, Moon } from "lucide-react";
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
import { ThemePresetSelector } from "../theme-preset-selector";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { useTRPC } from "@/providers/query-provider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// Keys that can be targeted for background edits
type TargetKey =
    | "background"
    | "sidebar"
    | "mailPanel"
    | "threadPanel"
    | "foreground" // Main text color
    | "muted-foreground" // Subtitle / muted text color
    | "all";

type ThemeMode = "auto" | "light" | "dark";

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
    fontFamily: string;
    onBorderRadiusChange: (v: number) => void;
    onBorderColorChange: (v: string) => void;
    onPrimaryColorChange: (v: string) => void;
    onFontFamilyChange: (v: string) => void;
    theme: ThemeMode;
}

interface BackgroundEditorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BackgroundEditorDialog({ open, onOpenChange }: BackgroundEditorDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showOverlay={true} className="max-w-6xl rounded-2xl p-0 shadow-xl bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 font-sans" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui' }}>
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
    const BG_TARGETS = [
        { key: "background", label: "Mail View", icon: <LayoutDashboard className="h-4 w-4" /> },
        { key: "sidebar", label: "Sidebar", icon: <PanelLeft className="h-4 w-4" /> },
        { key: "mailPanel", label: "Mail List", icon: <List className="h-4 w-4" /> },
    ] as const satisfies ReadonlyArray<{ key: TargetKey; label: string; icon: React.ReactNode }>;

    const TEXT_TARGETS = [
        {
            key: "foreground",
            label: "Text",
            icon: <span className="h-4 w-4 flex items-center justify-center font-semibold">T</span>,
        },
        {
            key: "muted-foreground",
            label: "Subtitle",
            icon: <span className="h-4 w-4 flex items-center justify-center font-semibold">S</span>,
        },
    ] as const satisfies ReadonlyArray<{ key: TargetKey; label: string; icon: React.ReactNode }>;

    const { themeState, setThemeState } = useEditorStore();
    const currentMode = themeState.currentMode as ThemeMode;

    const [borderRadius, setBorderRadius] = useState<number>(() =>
        parseFloat(themeState.styles.light.radius.replace("rem", "")),
    );
    const [borderColor, setBorderColor] = useState<string>(() => themeState.styles.light.border ?? "#e5e7eb");
    const [primaryColor, setPrimaryColor] = useState<string>(() => themeState.styles.light.primary);
    const [fontFamily, setFontFamily] = useState<string>(
        () => (themeState.styles.light as any)["font-sans"] ?? "",
    );

    // Map each background variable to its corresponding foreground variable (if any)
    const FOREGROUND_FOR: Record<TargetKey, string | null> = {
        background: "foreground",
        sidebar: "sidebar-foreground",
        mailPanel: "mailPanel-foreground",
        threadPanel: "threadPanel-foreground",
        foreground: null,
        "muted-foreground": null,
        all: null,
    } as const;

    const getSubtitleColor = (foreground: string): string => {
        // very light foreground? use lighter gray, else darker gray
        const isLight = foreground.toLowerCase() === "#ffffff";
        return isLight ? "#D1D5DB" /* slate-300 */ : "#6B7280"; /* slate-600 */
    };

    const updateColor = (key: TargetKey, value: string) => {
        const foregroundKey = FOREGROUND_FOR[key];
        const textColor = foregroundKey ? getContrastingTextColor(value) : undefined;
        const subtitleColor = textColor ? getSubtitleColor(textColor) : undefined;

        const effectiveMode: "light" | "dark" = themeState.currentMode === "dark" ? "dark" : "light";

        const updatedStylesForMode = {
            ...themeState.styles[effectiveMode],
            [key]: value,
        } as any;

        if (foregroundKey && textColor) {
            updatedStylesForMode[foregroundKey] = textColor;
        }

        if (subtitleColor) {
            updatedStylesForMode["muted-foreground"] = subtitleColor;
        }

        setThemeState({
            ...themeState,
            styles: {
                ...themeState.styles,
                [effectiveMode]: updatedStylesForMode,
            },
        });
    };

    // TRPC helpers for saving
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const { mutateAsync: createTheme } = useMutation(trpc.themes.create.mutationOptions());

    const [isSaving, setIsSaving] = useState(false);

    // Sync local control states when the overarching themeState changes (e.g., when a preset is applied)
    useEffect(() => {
        const parsedRadius = parseFloat(themeState.styles.light.radius.replace("rem", ""));
        if (!Number.isNaN(parsedRadius)) {
            setBorderRadius(parsedRadius);
        }
        setBorderColor(themeState.styles.light.border ?? "#e5e7eb");
        setPrimaryColor(themeState.styles.light.primary);
        setFontFamily((themeState.styles.light as any)["font-sans"] ?? "");
        // We only want to run this when style values coming from the store actually change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [themeState.styles.light.radius, themeState.styles.light.border, themeState.styles.light.primary, (themeState.styles.light as any)["font-sans"]]);

    useEffect(() => {
        const foregroundForPrimary = getContrastingTextColor(primaryColor);
        const commonUpdates = {
            radius: `${borderRadius}rem`,
            border: borderColor,
            primary: primaryColor,
            "primary-foreground": foregroundForPrimary,
            "font-sans": fontFamily,
        } as const;

        // Check if any of the common properties have actually changed to avoid an update loop
        const hasChanged = Object.entries(commonUpdates).some(
            ([key, val]) =>
                (themeState.styles.light as any)[key] !== val ||
                (themeState.styles.dark as any)[key] !== val,
        );

        if (!hasChanged) return;

        setThemeState({
            ...themeState,
            styles: {
                ...themeState.styles,
                light: { ...themeState.styles.light, ...commonUpdates },
                dark: { ...themeState.styles.dark, ...commonUpdates },
            },
        });
    }, [borderRadius, borderColor, primaryColor, fontFamily]);

    // Sync font family with themeState changes
    useEffect(() => {
        setFontFamily((themeState.styles.light as any)["font-sans"] ?? "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [(themeState.styles.light as any)["font-sans"]]);

    // ---------- Save Theme Handler ---------- //
    const handleSaveTheme = async () => {
        const name = prompt("Enter a name for your theme")?.trim();
        if (!name) return;

        setIsSaving(true);
        try {
            const newTheme = await createTheme({
                theme: {
                    name,
                    styles: themeState.styles,
                    public: false,
                },
            });

            // Update local state with returned id
            setThemeState({ ...themeState, id: newTheme.id });

            // Refresh user's theme list
            queryClient.invalidateQueries({ queryKey: trpc.themes.list.queryKey() });

            toast.success("Theme saved");
        } catch (err) {
            console.error("Failed to save theme", err);
            toast.error("Failed to save theme");
        } finally {
            setIsSaving(false);
        }
    };

    // Local state for mode switch within editor UI
    const handleModeSwitch = (mode: "light" | "dark") => {
        if (themeState.currentMode !== mode) {
            setThemeState({ ...themeState, currentMode: mode });
        }
    };

    return (
        <Tabs defaultValue="backgrounds" className="w-full">
            <TabsList className="flex justify-center mb-0 bg-transparent">
                {/* Mode toggle */}
                <div className="flex items-center justify-center gap-2 py-2">
                    <button
                        className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-xs", currentMode === "light" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                        onClick={() => handleModeSwitch("light")}
                    >
                        <Sun className="h-4 w-4" /> Light
                    </button>
                    <button
                        className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-xs", currentMode === "dark" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                        onClick={() => handleModeSwitch("dark")}
                    >
                        <Moon className="h-4 w-4" /> Dark
                    </button>
                </div>

                <TabsTrigger value="backgrounds">Backgrounds</TabsTrigger>
                <TabsTrigger value="others">Others</TabsTrigger>
            </TabsList>

            <TabsContent value="backgrounds">
                <div className="space-y-3 p-3">
                    {BG_TARGETS.map(({ key, label, icon }) => {
                        const currentVal = (themeState.styles[themeState.currentMode === "dark" ? "dark" : "light"] as any)[key] ?? "#ffffff";
                        return (
                            <div
                                key={key}
                                className="flex items-center gap-3 rounded-md border border-gray-200 dark:border-gray-700 p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <span className="flex items-center gap-2 w-32 text-xs capitalize">
                                    {icon}
                                    {label}
                                </span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            style={{ backgroundColor: currentVal }}
                                            className="h-8 w-8 shrink-0 cursor-pointer rounded-md border shadow-sm"
                                            aria-label={`Pick ${label} color`}
                                        />
                                    </PopoverTrigger>
                                    <PopoverContent side="right" align="start" className="w-auto p-4">
                                        <HexColorPicker color={currentVal} onChange={(v) => updateColor(key as TargetKey, v)} />
                                    </PopoverContent>
                                </Popover>
                                <Input
                                    className="flex-1 h-8 text-xs accent-blue-600"
                                    value={currentVal}
                                    onChange={(e) => updateColor(key as TargetKey, e.target.value)}
                                />
                            </div>
                        );
                    })}

                    <ThemePresetSelector />
                </div>
            </TabsContent>

            <TabsContent value="others">
                {/* Text colour controls */}
                <div className="space-y-3 p-3">
                    {TEXT_TARGETS.map(({ key, label, icon }) => {
                        const currentVal = (themeState.styles[themeState.currentMode === "dark" ? "dark" : "light"] as any)[key] ?? "#ffffff";
                        return (
                            <div
                                key={key}
                                className="flex items-center gap-3 rounded-md border border-gray-200 dark:border-gray-700 p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <span className="flex items-center gap-2 w-32 text-xs capitalize">
                                    {icon}
                                    {label}
                                </span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            style={{ backgroundColor: currentVal }}
                                            className="h-8 w-8 shrink-0 cursor-pointer rounded-md border shadow-sm"
                                            aria-label={`Pick ${label} color`}
                                        />
                                    </PopoverTrigger>
                                    <PopoverContent side="right" align="start" className="w-auto p-4">
                                        <HexColorPicker color={currentVal} onChange={(v) => updateColor(key as TargetKey, v)} />
                                    </PopoverContent>
                                </Popover>
                                <Input
                                    className="flex-1 h-8 text-xs accent-blue-600"
                                    value={currentVal}
                                    onChange={(e) => updateColor(key as TargetKey, e.target.value)}
                                />
                            </div>
                        );
                    })}
                </div>

                <DesignControls
                    borderRadius={borderRadius}
                    borderColor={borderColor}
                    primaryColor={primaryColor}
                    fontFamily={fontFamily}
                    onBorderRadiusChange={setBorderRadius}
                    onBorderColorChange={setBorderColor}
                    onPrimaryColorChange={setPrimaryColor}
                    onFontFamilyChange={setFontFamily}
                    theme={currentMode}
                />
            </TabsContent>

            {/* Save button */}
            <div className="flex justify-end border-t p-4">
                <Button onClick={handleSaveTheme} disabled={isSaving}>
                    {isSaving ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                        </span>
                    ) : (
                        "Save Theme"
                    )}
                </Button>
            </div>
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
    const { open } = useBackgroundEditor();

    if (!open) return null;

    return (
        <div
            tabIndex={0}
            className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-0 opacity-40 backdrop-blur-sm transition-opacity duration-150 hover:opacity-100 sm:inset-auto sm:bottom-4 sm:right-4 sm:flex-col sm:items-end sm:justify-end sm:p-0 rounded-2xl focus:opacity-100 font-sans"
        >
            <div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg w-[600px] max-w-[90vw] sm:w-[400px] font-sans" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui' }}>
                <div className="flex w-full flex-col h-[90vh] sm:h-[600px] sm:max-h-[85vh]">
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
            <div className="fixed bottom-4 right-20 z-50">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="dark:bg-gray-800 border border-gray-300 dark:border-gray-600 h-12 w-12 rounded-lg"
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

function DesignControls({
    borderRadius,
    borderColor,
    primaryColor,
    fontFamily,
    onBorderRadiusChange,
    onBorderColorChange,
    onPrimaryColorChange,
    onFontFamilyChange,
    theme: _theme,
}: DesignControlsProps) {
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

    return (
        <div className="space-y-8 max-w-sm mx-auto p-4">
            {/* Radius */}
            <div className="space-y-2 text-black">
                <label className="flex items-center gap-2 text-xs font-medium">
                    <Circle className="h-3 w-3" /> Radius
                </label>
                <div className="flex items-center gap-2">
                    <Slider
                        min={0}
                        max={2}
                        step={0.125}
                        value={[borderRadius]}
                        onValueChange={(val: number[]) => onBorderRadiusChange(val[0])}
                        className="flex-1"
                    />
                    <span className="w-12 text-right text-xs tabular-nums">
                        {borderRadius.toFixed(2)}
                    </span>
                </div>
            </div>
            {/* Border Color */}
            <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs text-black font-medium"><Square className="h-3 w-3" /> Border Color</label>
                <div className="flex items-center gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                className="h-8 w-8 rounded-md border shadow-sm"
                                style={{ backgroundColor: borderColor }}
                                aria-label="Pick border color"
                            />
                        </PopoverTrigger>
                        <PopoverContent side="right" align="start" className="w-auto p-2">
                            <HexColorPicker color={borderColor} onChange={onBorderColorChange} />
                        </PopoverContent>
                    </Popover>
                    <Input
                        className="flex-1 h-8 text-sm"
                        value={borderColor}
                        onChange={(e) => onBorderColorChange(e.target.value)}
                    />
                </div>
            </div>
            {/* Primary Color */}
            <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs text-black font-medium"><Palette className="h-3 w-3" /> Primary Color</label>
                <div className="flex items-center gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                className="h-8 w-8 rounded-md border shadow-sm"
                                style={{ backgroundColor: primaryColor }}
                                aria-label="Pick primary color"
                            />
                        </PopoverTrigger>
                        <PopoverContent side="right" align="start" className="w-auto p-2">
                            <HexColorPicker color={primaryColor} onChange={onPrimaryColorChange} />
                        </PopoverContent>
                    </Popover>
                    <Input
                        className="flex-1 h-8 text-sm"
                        value={primaryColor}
                        onChange={(e) => onPrimaryColorChange(e.target.value)}
                    />
                </div>
            </div>

            {/* Font Family */}
            <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs text-black font-medium"><TypeIcon className="h-3 w-3" /> Font Family</label>
                <Select value={fontFamily} onValueChange={onFontFamilyChange}>
                    <SelectTrigger className="w-full">
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
            </div>
        </div>
    );
} 