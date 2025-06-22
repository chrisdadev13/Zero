import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ThemeCard } from "./theme-card";
import { useEditorStore } from "@/store/editor-store";
import { useTRPC } from "@/providers/query-provider";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import type { ThemeStyles } from "@/lib/themes";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "use-intl";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";

interface PublicTheme {
    id: string;
    name: string;
    styles: ThemeStyles;
    userId?: string;
}

export function ThemeMarketplace() {
    const t = useTranslations();
    const trpc = useTRPC();
    const { themeState, setThemeState } = useEditorStore();
    const queryClient = useQueryClient();
    const { data: session } = useSession();

    // Search state
    const [query, setQuery] = useState("");

    // Dialog state
    const [themeToInstall, setThemeToInstall] = useState<PublicTheme | null>(null);
    const [installing, setInstalling] = useState(false);

    // Public marketplace themes
    const { data: publicData, isLoading, error } = useQuery(
        trpc.themes.listPublic.queryOptions({ page: 0, limit: 100 }),
    );

    // User's own installed/created themes – used to avoid duplicate installations
    const { data: userThemes = [] } = useQuery(trpc.themes.list.queryOptions());

    const themes: PublicTheme[] = (publicData?.themes as PublicTheme[]) ?? [];

    const mode = (themeState.currentMode ?? "light") as "light" | "dark";

    const filtered = themes.filter((t: PublicTheme) =>
        t.name.toLowerCase().includes(query.toLowerCase())
    );

    const { mutateAsync: createTheme } = useMutation(trpc.themes.create.mutationOptions());

    const handleSelect = (theme: PublicTheme) => {
        if (!theme.styles[mode]) {
            console.error(`Theme styles missing for mode: ${mode}`);
            return;
        }

        // If user already owns the public theme
        if (theme.userId === session?.user.id) {
            setThemeState({
                ...themeState,
                id: theme.id,
                styles: theme.styles,
                preset: undefined,
            });
            return;
        }

        // Check user's private themes for duplicates
        const existingTheme = (userThemes as PublicTheme[]).find(
            (t) => t.name.toLowerCase() === theme.name.toLowerCase(),
        );

        if (existingTheme) {
            setThemeState({
                ...themeState,
                id: existingTheme.id,
                styles: existingTheme.styles,
                preset: undefined,
            });
            return;
        }

        // Need installation confirmation
        setThemeToInstall(theme);
    };

    // Confirm install after user approval
    const confirmInstall = async () => {
        if (!themeToInstall) return;
        setInstalling(true);
        try {
            const newTheme = await createTheme({
                theme: {
                    name: themeToInstall.name,
                    styles: themeToInstall.styles,
                    public: false,
                },
            });

            queryClient.invalidateQueries({ queryKey: trpc.themes.list.queryKey() });

            setThemeState({
                ...themeState,
                id: newTheme.id,
                styles: themeToInstall.styles,
                preset: undefined,
            });

            setThemeToInstall(null);
        } catch (err) {
            console.error("Failed to install theme", err);
            toast.error(t("common.settings.failedToSave"));
        } finally {
            setInstalling(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-32 w-full items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-32 w-full items-center justify-center">
                <p className="text-sm text-red-500">{t("common.themeEditor.failedToLoadThemes")}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-lg font-medium">{t("common.themeEditor.marketplace")}</p>
                <div>
                    <Link to="editor">
                        <Button variant="secondary" size="sm">
                            {t('common.themeEditor.createEditTheme')}
                        </Button>
                    </Link>
                </div>
            </div>
            <Input
                placeholder={t("common.themeEditor.searchPlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <div className="grid gap-4 grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
                {filtered.map((theme: PublicTheme) => (
                    <ThemeCard
                        key={theme.id}
                        name={theme.name}
                        styles={theme.styles[mode] ?? {}}
                        onSelect={() => handleSelect(theme)}
                    />
                ))}
            </div>
            {filtered.length === 0 && (
                <p className="text-muted-foreground text-sm">{t("common.themeEditor.noThemesFound")}</p>
            )}

            {/* Install confirmation dialog */}
            <Dialog open={!!themeToInstall} onOpenChange={(open) => !open && setThemeToInstall(null)}>
                <DialogContent showOverlay>
                    <DialogHeader>
                        <DialogTitle>Install Theme</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to install the "{themeToInstall?.name ?? ""}" theme?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <DialogClose asChild>
                            <Button variant="secondary" disabled={installing}>
                                {t("common.actions.cancel")}
                            </Button>
                        </DialogClose>
                        <Button onClick={confirmInstall} disabled={installing}>
                            {installing ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Installing...
                                </span>
                            ) : (
                                'Install'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 