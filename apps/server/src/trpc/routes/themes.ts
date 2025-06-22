import z from "zod";
import { getZeroDB } from "../../lib/server-utils";
import { router, privateProcedure, activeConnectionProcedure } from "../trpc";
import { themeStylesSchema } from "../../lib/themes";

function assertCanPublish(isFork: boolean) {
    if (isFork) {
        throw new Error("You cannot make a theme public if it was forked from another user's theme.");
    }
}

export const themesRouter = router({
    getActive: activeConnectionProcedure.query(async ({ ctx }) => {
        const db = getZeroDB(ctx.sessionUser.id);

        const themeId = ctx.activeConnection.currentThemeId;

        if (!themeId) {
            // No theme has been set for this connection yet
            return null;
        }

        const theme = await db.findThemeById(themeId);
        return theme ?? null;
    }),
    create: privateProcedure
        .input(
            z.object({
                theme: z.object({
                    name: z.string(),
                    styles: themeStylesSchema,
                    public: z.boolean().optional(),
                    sourceThemeId: z.string().optional(),
                }),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { theme } = input;

            if (theme.public && theme.sourceThemeId) {
                assertCanPublish(true);
            }

            const db = getZeroDB(ctx.sessionUser.id);
            const newTheme = await db.createTheme({
                id: crypto.randomUUID(),
                name: theme.name,
                styles: theme.styles,
                public: theme.public,
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: ctx.sessionUser.id,
                sourceThemeId: theme.sourceThemeId,
            });
            return newTheme;
        }),
    update: privateProcedure
        .input(
            z.object({
                themeId: z.string(),
                theme: z.object({
                    name: z.string(),
                    styles: themeStylesSchema,
                    public: z.boolean().optional(),
                }),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { themeId, theme } = input;
            const db = getZeroDB(ctx.sessionUser.id);

            const existing = await db.findThemeById(themeId);
            if (!existing) {
                throw new Error("Theme not found");
            }

            if (existing.userId !== ctx.sessionUser.id) {
                throw new Error("Unauthorized");
            }

            if (theme.public && existing.sourceThemeId) {
                assertCanPublish(true);
            }

            const updatedTheme = await db.updateTheme(themeId, theme);
            return updatedTheme;
        }),
    list: privateProcedure.query(async ({ ctx }) => {
        const db = getZeroDB(ctx.sessionUser.id);
        const themes = await db.findThemesByUser(ctx.sessionUser.id);
        return themes;
    }),
    listPublic: privateProcedure.input(z.object({
        page: z.number().optional().default(0),
        limit: z.number().optional().default(20),
    })).query(async ({ ctx, input }) => {
        const { page = 0, limit = 20 } = input;
        const db = getZeroDB(ctx.sessionUser.id);
        const themes = await db.findPublicThemes(limit, page * limit);

        if (!themes) {
            return {
                themes: [],
                hasMore: false,
            };
        }

        const totalCount = await db.countPublicThemes();

        return {
            themes,
            hasMore: (page + 1) * limit < totalCount,
        };
    }),
    delete: privateProcedure.input(z.object({
        themeId: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const db = getZeroDB(ctx.sessionUser.id);
        await db.deleteTheme(ctx.sessionUser.id, input.themeId);
        return { success: true };
    }),
});