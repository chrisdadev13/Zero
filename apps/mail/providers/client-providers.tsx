import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { SidebarProvider } from '@/components/ui/sidebar';
import { PostHogProvider } from '@/lib/posthog-provider';
import { Provider as JotaiProvider } from 'jotai';
import type { PropsWithChildren } from 'react';
import Toaster from '@/components/ui/toast';

export function ClientProviders({ children }: PropsWithChildren) {

  return (
    <NuqsAdapter>
      <JotaiProvider>
        <SidebarProvider>
          <PostHogProvider>
            {children}
            <Toaster />
          </PostHogProvider>
        </SidebarProvider>
      </JotaiProvider>
    </NuqsAdapter>
  );
}
