import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/providers/query-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zero/server/trpc";

export default function ThemesMarketplacePage() {
    const trpc = useTRPC();
    const [page, setPage] = useState(0);
    const limit = 20;

    const { data, isFetching, error } = useQuery(
        trpc.themes.listPublic.queryOptions({ page, limit }),
    );

    const themes = data?.themes ?? [];

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-semibold">Theme Marketplace</h1>
            {error && (
                <div className="text-red-500 p-4 rounded-md bg-red-50">
                    Failed to load themes. Please try again.
                </div>
            )}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {themes.map((t: inferRouterOutputs<AppRouter>["themes"]["listPublic"]["themes"]) => (
                    <Card key={t.id}>
                        <CardHeader>
                            <CardTitle>{t.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-16 w-full rounded-md bg-muted" />
                            <p className="mt-2 text-xs text-muted-foreground">Created by {t.userId.slice(0, 8) || 'Unknown'}…</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="flex justify-center pt-4">
                <Button
                    variant="outline"
                    disabled={isFetching || !data?.hasMore}
                    onClick={() => setPage((p) => p + 1)}
                >
                    {isFetching ? "Loading…" : data?.hasMore ? "Load More" : "No more themes"}
                </Button>
            </div>
        </div>
    );
} 