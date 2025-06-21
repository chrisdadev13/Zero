"use client";

import { useState } from "react";
import { SettingsCard } from "@/components/settings/settings-card";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/store/editor-store";
import ThemeEditorControls from "@/components/theme/theme-editor-controls";
import { useTRPC } from "@/providers/query-provider";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "use-intl";
import { PublishThemeDialog } from "@/components/theme/publish-theme-dialog";

export default function ThemeEditorPage() {
    const t = useTranslations();
    const { themeState } = useEditorStore();
    const { resetToCurrentPreset } = useEditorStore();
    const [dialogOpen, setDialogOpen] = useState(false);
    const trpc = useTRPC();
    const { mutateAsync: createTheme } = useMutation(trpc.themes.create.mutationOptions());

    const handlePublish = async (data: { name: string }) => {
        await toast.promise(
            createTheme({
                theme: {
                    name: data.name,
                    styles: themeState.styles,
                    public: true,
                },
            }),
            {
                loading: t("common.actions.saving"),
                success: "Theme published!",
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
                        <Button onClick={() => setDialogOpen(true)}>Publish</Button>
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
            <PublishThemeDialog open={dialogOpen} onOpenChange={setDialogOpen} onPublish={handlePublish} />
        </div>
    );
} 