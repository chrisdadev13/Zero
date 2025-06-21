import { atom, useAtom } from "jotai";
import { getDefaultStore } from "jotai";
import { defaultPresets } from "../lib/theme-presets";
// import { getThemes } from "../actions/themes";
import type { ThemePreset } from "../types/themes";

interface ThemePresetStore {
    presets: Record<string, ThemePreset>;
    registerPreset: (name: string, preset: ThemePreset) => void;
    unregisterPreset: (name: string) => void;
    updatePreset: (name: string, preset: ThemePreset) => void;
    getPreset: (name: string) => ThemePreset | undefined;
    getAllPresets: () => Record<string, ThemePreset>;
    unloadSavedPresets: () => void;
}

// ------------ Atoms ------------ //
const presetsAtom = atom<Record<string, ThemePreset>>({ ...defaultPresets });

// ------------ Hook ------------ //
function useThemePresetStoreHook(): ThemePresetStore {
    const [presets, setPresets] = useAtom(presetsAtom);

    const registerPreset = (name: string, preset: ThemePreset) => {
        setPresets({ ...presets, [name]: preset });
    };

    const unregisterPreset = (name: string) => {
        const { [name]: _removed, ...remaining } = presets;
        setPresets(remaining);
    };

    const updatePreset = (name: string, preset: ThemePreset) => {
        setPresets({ ...presets, [name]: preset });
    };

    const getPreset = (name: string) => presets[name];
    const getAllPresets = () => presets;

    const unloadSavedPresets = () => {
        setPresets({ ...defaultPresets });
    };

    return {
        presets,
        registerPreset,
        unregisterPreset,
        updatePreset,
        getPreset,
        getAllPresets,
        unloadSavedPresets,
    };
}

// Assign the hook to a const so that we can later augment it with a `getState` util
export const useThemePresetStore = Object.assign(useThemePresetStoreHook, {
    /**
     * Helper to access the underlying presets outside of React (similar to Zustand's getState).
     */
    getState: (): Pick<ThemePresetStore, "presets" | "getPreset" | "getAllPresets"> => {
        const store = getDefaultStore();
        const presets = store.get(presetsAtom);
        return {
            presets,
            getPreset: (name: string) => presets[name],
            getAllPresets: () => presets,
        };
    },
});