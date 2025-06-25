import {
  Form,
} from '@/components/ui/form';
import { SettingsCard } from '@/components/settings/settings-card';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTRPC } from '@/providers/query-provider';
import { useMutation } from '@tanstack/react-query';
import { useSettings } from '@/hooks/use-settings';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'use-intl';
import { useForm } from 'react-hook-form';
import { useTheme } from '@/components/themes-provider';
import { useState } from 'react';
import { toast } from 'sonner';
import * as z from 'zod';
import { ThemePresetSelector } from '@/components/theme-preset-selector';
import { UserThemeSelector } from '@/components/theme-saved-selector';
import { ThemeToggle } from '@/components/theme/toggle-theme';
import { ThemeMarketplace } from '@/components/theme/theme-marketplace';

const formSchema = z.object({
  colorTheme: z.enum(['dark', 'light', 'system', '']),
});

type Theme = 'dark' | 'light' | 'system';

export default function AppearancePage() {
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations();
  const { data, refetch } = useSettings();
  const { theme } = useTheme();
  const trpc = useTRPC();
  const { mutateAsync: saveUserSettings } = useMutation(trpc.settings.save.mutationOptions());

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      colorTheme: data?.settings.colorTheme || (theme as Theme),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (data) {
      setIsSaving(true);
      toast.promise(
        saveUserSettings({
          ...data.settings,
          colorTheme: values.colorTheme as Theme,
        }),
        {
          success: t('common.settings.saved'),
          error: t('common.settings.failedToSave'),
          finally: async () => {
            await refetch();
            setIsSaving(false);
          },
        },
      );
    }
  }

  if (!data?.settings) return null;

  return (
    <div className="grid gap-6">
      <SettingsCard
        title={t('pages.settings.appearance.title')}
        description={t('pages.settings.appearance.description')}
      >
        <Form {...form}>
          <form id="appearance-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4 -ml-2">
              <ThemeToggle />
            </div>
            <ThemePresetSelector />
            <UserThemeSelector />
            <Button type="submit" form="appearance-form" disabled={isSaving}>
              {isSaving ? t('common.actions.saving') : t('common.actions.saveChanges')}
            </Button>
            <ThemeMarketplace />
          </form>
        </Form>
      </SettingsCard>
    </div>
  );
}
