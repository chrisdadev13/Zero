import { HotkeyProviderWrapper } from '@/components/providers/hotkey-provider-wrapper';
import { CommandPaletteProvider } from '@/components/context/command-palette-context';
import { Outlet } from 'react-router';
import { ThemeProvider } from '@/components/themes-provider';

export default function Layout() {
  return (
    <CommandPaletteProvider>
      {/* <VoiceProvider> */}
      <HotkeyProviderWrapper>
        <ThemeProvider defaultTheme="light">
          <div className="relative flex max-h-screen w-full overflow-hidden">
            <Outlet />
          </div>
        </ThemeProvider>
      </HotkeyProviderWrapper>
      {/* </VoiceProvider> */}
    </CommandPaletteProvider>
  );
}
