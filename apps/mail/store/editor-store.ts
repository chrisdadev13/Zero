import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { getDefaultStore } from "jotai";
import type { ThemeEditorState } from "../lib/theme-editor";
import { defaultThemeState } from "../config/theme";
import { getPresetThemeStyles } from "../lib/theme-preset-helper";
import { isDeepEqual } from "../lib/is-deep-equal";

const MAX_HISTORY_COUNT = 30;
const HISTORY_OVERRIDE_THRESHOLD_MS = 500; // 0.5 seconds

interface ThemeHistoryEntry {
    state: ThemeEditorState;
    timestamp: number;
}

interface EditorStore {
    themeState: ThemeEditorState;
    themeCheckpoint: ThemeEditorState | null;
    history: ThemeHistoryEntry[];
    future: ThemeHistoryEntry[];
    setThemeState: (state: ThemeEditorState) => void;
    applyThemePreset: (preset: string) => void;
    saveThemeCheckpoint: () => void;
    restoreThemeCheckpoint: () => void;
    resetToCurrentPreset: () => void;
    hasThemeChangedFromCheckpoint: () => boolean;
    hasUnsavedChanges: () => boolean;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
}

// ----------------- Atoms ----------------- //
const themeStateAtom = atomWithStorage<ThemeEditorState>(
    "editor-theme-state",
    defaultThemeState,
);

const themeCheckpointAtom = atom<ThemeEditorState | null>(null);
const historyAtom = atom<ThemeHistoryEntry[]>([]);
const futureAtom = atom<ThemeHistoryEntry[]>([]);

// ----------------- Hook ----------------- //
function useEditorStoreHook(): EditorStore {
    const [themeState, setThemeStateAtom] = useAtom(themeStateAtom);
    const [themeCheckpoint, setThemeCheckpoint] = useAtom(themeCheckpointAtom);
    const [history, setHistory] = useAtom(historyAtom);
    const [future, setFuture] = useAtom(futureAtom);

    const setThemeState = (newState: ThemeEditorState) => {
        const oldThemeState = themeState;

        // Check if only currentMode changed
        const oldStateWithoutMode = { ...oldThemeState, currentMode: undefined } as any;
        const newStateWithoutMode = { ...newState, currentMode: undefined } as any;

        if (
            isDeepEqual(oldStateWithoutMode, newStateWithoutMode) &&
            oldThemeState.currentMode !== newState.currentMode
        ) {
            // Only currentMode changed
            setThemeStateAtom(newState);
            return;
        }

        const currentTime = Date.now();
        let currentHistory = history;
        let currentFuture = future;

        const lastHistoryEntry =
            currentHistory.length > 0 ? currentHistory[currentHistory.length - 1] : null;

        if (
            !lastHistoryEntry ||
            currentTime - lastHistoryEntry.timestamp >= HISTORY_OVERRIDE_THRESHOLD_MS
        ) {
            // Add a new history entry
            currentHistory = [...currentHistory, { state: oldThemeState, timestamp: currentTime }];
            currentFuture = [];
        }

        if (currentHistory.length > MAX_HISTORY_COUNT) {
            currentHistory.shift(); // Remove the oldest entry
        }

        setThemeStateAtom(newState);
        setHistory(currentHistory);
        setFuture(currentFuture);
    };

    const applyThemePreset = (preset: string) => {
        const currentThemeState = themeState;
        const currentTime = Date.now();
        const newStyles = getPresetThemeStyles(preset);
        const newThemeState: ThemeEditorState = {
            ...currentThemeState,
            preset,
            styles: newStyles,
            hslAdjustments: defaultThemeState.hslAdjustments,
        };

        const newHistoryEntry = { state: currentThemeState, timestamp: currentTime };
        let updatedHistory = [...history, newHistoryEntry];
        if (updatedHistory.length > MAX_HISTORY_COUNT) {
            updatedHistory.shift();
        }

        setThemeStateAtom(newThemeState);
        setThemeCheckpoint(newThemeState);
        setHistory(updatedHistory);
        setFuture([]);
    };

    const saveThemeCheckpoint = () => {
        setThemeCheckpoint(themeState);
    };

    const restoreThemeCheckpoint = () => {
        const checkpoint = themeCheckpoint;
        if (checkpoint) {
            const oldThemeState = themeState;
            const currentTime = Date.now();
            const newHistoryEntry = { state: oldThemeState, timestamp: currentTime };
            let updatedHistory = [...history, newHistoryEntry];
            if (updatedHistory.length > MAX_HISTORY_COUNT) {
                updatedHistory.shift();
            }

            setThemeStateAtom({
                ...checkpoint,
                currentMode: themeState.currentMode,
            });
            setHistory(updatedHistory);
            setFuture([]);
        } else {
            console.warn("No theme checkpoint available to restore to.");
        }
    };

    const hasThemeChangedFromCheckpoint = () => {
        const checkpoint = themeCheckpoint;
        return !isDeepEqual(themeState, checkpoint);
    };

    const hasUnsavedChanges = () => {
        const presetThemeStyles = getPresetThemeStyles(themeState.preset ?? "default");
        const stylesChanged = !isDeepEqual(themeState.styles, presetThemeStyles);
        const hslChanged = !isDeepEqual(
            themeState.hslAdjustments,
            defaultThemeState.hslAdjustments,
        );
        return stylesChanged || hslChanged;
    };

    const resetToCurrentPreset = () => {
        const presetThemeStyles = getPresetThemeStyles(themeState.preset ?? "default");
        const newThemeState: ThemeEditorState = {
            ...themeState,
            styles: presetThemeStyles,
            hslAdjustments: defaultThemeState.hslAdjustments,
        };

        setThemeStateAtom(newThemeState);
        setThemeCheckpoint(newThemeState);
        setHistory([]);
        setFuture([]);
    };

    const undo = () => {
        if (history.length === 0) {
            return;
        }

        const currentThemeState = themeState;
        const lastHistoryEntry = history[history.length - 1];
        const newHistory = history.slice(0, -1);
        const newFutureEntry = { state: currentThemeState, timestamp: Date.now() };
        const newFuture = [newFutureEntry, ...future];

        setThemeStateAtom({
            ...lastHistoryEntry.state,
            currentMode: currentThemeState.currentMode,
        });
        setThemeCheckpoint(lastHistoryEntry.state);
        setHistory(newHistory);
        setFuture(newFuture);
    };

    const redo = () => {
        if (future.length === 0) {
            return;
        }

        const firstFutureEntry = future[0];
        const newFuture = future.slice(1);
        const currentThemeState = themeState;
        const newHistoryEntry = { state: currentThemeState, timestamp: Date.now() };
        let updatedHistory = [...history, newHistoryEntry];
        if (updatedHistory.length > MAX_HISTORY_COUNT) {
            updatedHistory.shift();
        }

        setThemeStateAtom({
            ...firstFutureEntry.state,
            currentMode: currentThemeState.currentMode,
        });
        setThemeCheckpoint(firstFutureEntry.state);
        setHistory(updatedHistory);
        setFuture(newFuture);
    };

    const canUndo = () => history.length > 0;
    const canRedo = () => future.length > 0;

    return {
        themeState,
        themeCheckpoint,
        history,
        future,
        setThemeState,
        applyThemePreset,
        saveThemeCheckpoint,
        restoreThemeCheckpoint,
        resetToCurrentPreset,
        hasThemeChangedFromCheckpoint,
        hasUnsavedChanges,
        undo,
        redo,
        canUndo,
        canRedo,
    };
}

export const useEditorStore = Object.assign(useEditorStoreHook, {
    // Provide a getState helper for convenience (not used currently)
    getState: () => {
        const store = getDefaultStore();
        return {
            themeState: store.get(themeStateAtom),
            themeCheckpoint: store.get(themeCheckpointAtom),
            history: store.get(historyAtom),
            future: store.get(futureAtom),
        } as Pick<EditorStore, "themeState" | "themeCheckpoint" | "history" | "future">;
    },
});