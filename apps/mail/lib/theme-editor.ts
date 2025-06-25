import type { ThemeStyles } from "./themes";

export interface BaseEditorState {
    styles: ThemeStyles;
}

export interface EditorControls {
}

export interface EditorPreviewProps {
    styles: ThemeStyles;
}

export interface ThemeEditorState extends BaseEditorState {
    id?: string;
    preset?: string;
    styles: ThemeStyles;
    currentMode: "light" | "dark";
    hslAdjustments?: {
        hueShift: number;
        saturationScale: number;
        lightnessScale: number;
    };
}

export type EditorType = "button" | "input" | "card" | "dialog" | "theme";

export interface EditorConfig {
    type: EditorType;
    name: string;
    description: string;
    defaultState: BaseEditorState;
    controls: React.ComponentType<any>;
    preview: React.ComponentType<any>;
}