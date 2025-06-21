"use client";

import { useState } from "react";
import { SettingsCard } from "@/components/settings/settings-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEditorStore } from "@/store/editor-store";
import ThemeEditorControls from "@/components/theme/theme-editor-controls";
import { useTRPC } from "@/providers/query-provider";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "use-intl";
import { Switch } from '@/components/ui/switch';

export default function ThemeEditorPage() {
    const t = useTranslations();
    const { themeState } = useEditorStore();
    const { resetToCurrentPreset } = useEditorStore();
    const [name, setName] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const trpc = useTRPC();
    const { mutateAsync: createTheme } = useMutation(trpc.themes.create.mutationOptions());

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Name is required");
            return;
        }

        await toast.promise(
            createTheme({
                theme: {
                    name: name.trim(),
                    styles: themeState.styles,
                    public: isPublic,
                },
            }),
            {
                loading: t("common.actions.saving"),
                success: t("common.settings.saved"),
                error: t("common.settings.failedToSave"),
            },
        );
    };

    return (
        <div className="grid gap-6">
            <SettingsCard
                title={"Theme Editor"}
                description={"Adjust styles and save as a custom theme."}
                footer={
                    <div className="flex items-center gap-2 w-full max-w-md">
                        <Input
                            placeholder={"Theme name"}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-sm">Public</span>
                            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                        </div>
                        <Button onClick={handleSave}>{t("common.actions.save")}</Button>
                        <button
                            type="button"
                            style={{ border: '1px solid #ef4444', color: '#ef4444' }}
                            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-red-50"
                            onClick={() => resetToCurrentPreset()}
                        >
                            Reset
                        </button>
                    </div>
                }
            >
                <ThemeEditorControls />
            </SettingsCard>
        </div>
    );
} 