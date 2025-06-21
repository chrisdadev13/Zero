import { useQueryState } from "nuqs";
import React from "react";
import { useEditorStore } from "@/store/editor-store";

export const useThemePresetFromUrl = () => {
    const [preset, setPreset] = useQueryState("theme");
    const { applyThemePreset } = useEditorStore();

    React.useEffect(() => {
        if (preset) {
            try {
                if (typeof preset === 'string' && preset.trim()) {
                    applyThemePreset(preset);
                }
            } catch (error) {
                console.error('Failed to apply theme preset:', error);
            } finally {
                setPreset(null);
            }
        }
    }, [preset, setPreset, applyThemePreset]);

};