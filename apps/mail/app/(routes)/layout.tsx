import { HotkeyProviderWrapper } from '@/components/providers/hotkey-provider-wrapper';
import { CommandPaletteProvider } from '@/components/context/command-palette-context';
import { Outlet } from 'react-router';
import { ThemeProvider } from '@/components/themes-provider';
import { useActiveConnection } from '@/hooks/use-connections';

export default function Layout() {
  const { data: activeConnection } = useActiveConnection();
  return (
    <CommandPaletteProvider>
      {/* <VoiceProvider> */}
      <HotkeyProviderWrapper>
        <ThemeProvider defaultTheme="dark" connectionId={activeConnection?.id || undefined}>
          <div className="relative flex max-h-screen w-full overflow-hidden">
            <Outlet />
          </div>
        </ThemeProvider>
      </HotkeyProviderWrapper>
      {/* </VoiceProvider> */}
    </CommandPaletteProvider>
  );
}
