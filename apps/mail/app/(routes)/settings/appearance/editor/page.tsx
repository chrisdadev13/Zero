import ThemeEditorControls from '@/components/theme/theme-editor-controls';
import { SettingsCard } from '@/components/settings/settings-card';
import { useEditorStore } from '@/store/editor-store';
import { useTRPC } from '@/providers/query-provider';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'use-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { PublishThemeDialog } from '@/components/theme/publish-theme-dialog';

export default function ThemeEditorPage() {
  const t = useTranslations();
  const { themeState, resetToCurrentPreset, setThemeState } = useEditorStore();
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
          loading: t('common.actions.saving'),
          success: t('common.settings.saved'),
          error: t('common.settings.failedToSave'),
        },
      );
    } catch (error) {
      console.error('Failed to publish theme', error);
      toast.error(t('common.settings.failedToSave'));
    }
  };

  return (
    <div className="grid gap-6">
      <SettingsCard
        title={t('common.themeEditor.themeEditorTitle')}
        description={t('common.themeEditor.themeEditorDescription')}
        footer={
          <div className="flex w-full max-w-md items-center gap-2">
            <Button onClick={() => setDialogOpen(true)}>{t('common.themeEditor.publish')}</Button>
            <Button
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-50"
              onClick={() => resetToCurrentPreset()}
            >
              {t('common.themeEditor.reset')}
            </Button>
          </div>
        }
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium capitalize">Mode</span>
          <ToggleGroup
            type="single"
            value={themeState.currentMode}
            onValueChange={(val) =>
              val &&
              setThemeState({
                ...themeState,
                currentMode: val as 'light' | 'dark',
              })
            }
          >
            <ToggleGroupItem value="light">Light</ToggleGroupItem>
            <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <ThemeEditorControls />
      </SettingsCard>
      <PublishThemeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onPublish={handlePublish}
      />
    </div>
  );
}

