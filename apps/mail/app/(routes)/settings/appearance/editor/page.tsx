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
        try {

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
                    success: t("common.settings.saved"),
                    error: t("common.settings.failedToSave"),
                },
            );
        } catch (error) {
            console.error("Failed to publish theme", error);
            toast.error(t("common.settings.failedToSave"));
        }
    };

    return (
        <div className="grid gap-6">
            <SettingsCard
                title={t("common.themeEditor.themeEditorTitle")}
                description={t("common.themeEditor.themeEditorDescription")}
                footer={
                    <div className="flex items-center gap-2 w-full max-w-md">
                        <Button onClick={() => setDialogOpen(true)}>{t("common.themeEditor.publish")}</Button>
                        <Button
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-50"
                            onClick={() => resetToCurrentPreset()}
                        >
                            {t("common.themeEditor.reset")}
                        </Button>
                    </div>
                }
            >
                <ThemeEditorControls />
            </SettingsCard>
            <PublishThemeDialog open={dialogOpen} onOpenChange={setDialogOpen} onPublish={handlePublish} />
        </div>
    );
} 