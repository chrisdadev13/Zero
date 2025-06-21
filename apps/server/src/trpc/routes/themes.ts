import z from "zod";
import { getZeroDB } from "../../lib/server-utils";
import { router, privateProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { themeStylesSchema } from "../../lib/themes";

export const themesRouter = router({
    getByConnectionId: privateProcedure.input(z.object({
        connectionId: z.string(),
    })).query(async ({ ctx, input }) => {
        const { connectionId } = input;
        const db = getZeroDB(ctx.sessionUser.id);

        const connection = await db.findConnectionById(connectionId);

        if (!connection) throw new TRPCError({ code: "NOT_FOUND", message: "Connection not found" });
        if (!connection.currentThemeId) throw new TRPCError({ code: "NOT_FOUND", message: "Theme not found" });

        const theme = await db.findThemeById(connection.currentThemeId);
        if (!theme) throw new TRPCError({ code: "NOT_FOUND", message: "Theme not found" });

        return theme;
    }),
    create: privateProcedure.input(z.object({
        theme: z.object({
            name: z.string(),
            styles: themeStylesSchema,
            public: z.boolean().optional(),
        }),
    })).mutation(async ({ ctx, input }) => {
        const { theme } = input;
        const db = getZeroDB(ctx.sessionUser.id);
        const newTheme = await db.createTheme({
            id: crypto.randomUUID(),
            name: theme.name,
            styles: theme.styles,
            public: theme.public,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: ctx.sessionUser.id,
        });
        return newTheme;
    }),
    update: privateProcedure.input(z.object({
        themeId: z.string(),
        theme: z.object({
            name: z.string(),
            styles: themeStylesSchema,
            public: z.boolean().optional(),
        }),
        public: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
        const { themeId, theme } = input;
        const db = getZeroDB(ctx.sessionUser.id);
        const updatedTheme = await db.updateTheme(themeId, theme);
        return updatedTheme;
    }),
    delete: privateProcedure.input(z.object({
        themeId: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const { themeId } = input;
        const db = getZeroDB(ctx.sessionUser.id);
        await db.deleteTheme(themeId);
        return { success: true };
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

        return {
            themes,
            hasMore: themes.length === limit,
        };
    }),
});