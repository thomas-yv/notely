"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notesRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const prisma_js_1 = require("../lib/prisma.js");
const auth_js_1 = require("../middlewares/auth.js");
exports.notesRouter = (0, express_1.Router)();
exports.notesRouter.use(auth_js_1.authMiddleware);
const createNoteSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    content: zod_1.z.string().default(""),
    visibility: zod_1.z.enum(["PRIVATE", "PUBLIC", "PROTECTED"]).default("PRIVATE"),
    password: zod_1.z.string().optional(),
}).refine((data) => {
    if (data.visibility === "PROTECTED") {
        return !!data.password && data.password.trim().length > 0;
    }
    return true;
}, {
    message: "Password is required for PROTECTED notes",
    path: ["password"],
});
const updateNoteSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    content: zod_1.z.string().optional(),
    visibility: zod_1.z.enum(["PRIVATE", "PUBLIC", "PROTECTED"]).optional(),
    password: zod_1.z.string().optional(),
});
const shareNoteSchema = zod_1.z.object({
    identifier: zod_1.z.string().min(1),
    canEdit: zod_1.z.boolean().default(false),
});
exports.notesRouter.get("/", async (req, res) => {
    const userId = req.user.userId;
    try {
        const ownNotes = await prisma_js_1.prisma.note.findMany({
            where: { authorId: userId },
            include: {
                shares: {
                    include: {
                        user: {
                            select: { id: true, username: true, email: true },
                        },
                    },
                },
            },
            orderBy: { updatedAt: "desc" },
        });
        const sharedNotes = await prisma_js_1.prisma.note.findMany({
            where: {
                shares: {
                    some: { userId },
                },
            },
            include: {
                author: {
                    select: { id: true, username: true, email: true },
                },
                shares: {
                    where: { userId },
                    select: { canEdit: true },
                },
            },
            orderBy: { updatedAt: "desc" },
        });
        const sanitizedOwnNotes = ownNotes.map((note) => {
            const { passwordHash, ...rest } = note;
            return {
                ...rest,
                isOwner: true,
                canEdit: true,
                hasPassword: !!passwordHash,
            };
        });
        const sanitizedSharedNotes = sharedNotes.map((note) => {
            const { passwordHash, shares, ...rest } = note;
            return {
                ...rest,
                isOwner: false,
                canEdit: shares[0]?.canEdit ?? false,
                hasPassword: !!passwordHash,
            };
        });
        res.json({
            ownNotes: sanitizedOwnNotes,
            sharedNotes: sanitizedSharedNotes,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch notes" });
    }
});
exports.notesRouter.post("/", async (req, res) => {
    const parseResult = createNoteSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.flatten() });
        return;
    }
    const { title, content, visibility, password } = parseResult.data;
    const userId = req.user.userId;
    try {
        let passwordHash = null;
        if (visibility === "PROTECTED" && password) {
            passwordHash = await bcryptjs_1.default.hash(password, 10);
        }
        const note = await prisma_js_1.prisma.note.create({
            data: {
                title,
                content,
                visibility,
                passwordHash,
                authorId: userId,
            },
        });
        const { passwordHash: _, ...noteData } = note;
        res.status(201).json({
            ...noteData,
            isOwner: true,
            canEdit: true,
            hasPassword: !!note.passwordHash,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to create note" });
    }
});
exports.notesRouter.put("/:id", async (req, res) => {
    const noteId = req.params.id;
    const userId = req.user.userId;
    const parseResult = updateNoteSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.flatten() });
        return;
    }
    try {
        const note = await prisma_js_1.prisma.note.findUnique({
            where: { id: noteId },
            include: {
                shares: {
                    where: { userId },
                },
            },
        });
        if (!note) {
            res.status(404).json({ error: "Note not found" });
            return;
        }
        const isAuthor = note.authorId === userId;
        const canEdit = isAuthor || (note.shares.length > 0 && note.shares[0].canEdit);
        if (!canEdit) {
            res.status(403).json({ error: "Forbidden: You do not have permission to edit this note" });
            return;
        }
        const { title, content, visibility, password } = parseResult.data;
        const updateData = {};
        if (title !== undefined)
            updateData.title = title;
        if (content !== undefined)
            updateData.content = content;
        if (isAuthor && visibility !== undefined) {
            updateData.visibility = visibility;
            if (visibility === "PROTECTED") {
                if (password) {
                    updateData.passwordHash = await bcryptjs_1.default.hash(password, 10);
                }
                else if (!note.passwordHash) {
                    res.status(400).json({ error: "Password required when switching to PROTECTED" });
                    return;
                }
            }
            else {
                updateData.passwordHash = null;
            }
        }
        else if (isAuthor && password && note.visibility === "PROTECTED") {
            updateData.passwordHash = await bcryptjs_1.default.hash(password, 10);
        }
        const updatedNote = await prisma_js_1.prisma.note.update({
            where: { id: noteId },
            data: updateData,
        });
        const { passwordHash: _, ...noteData } = updatedNote;
        res.json({
            ...noteData,
            isOwner: isAuthor,
            canEdit: true,
            hasPassword: !!updatedNote.passwordHash,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to update note" });
    }
});
exports.notesRouter.delete("/:id", async (req, res) => {
    const noteId = req.params.id;
    const userId = req.user.userId;
    try {
        const note = await prisma_js_1.prisma.note.findUnique({
            where: { id: noteId },
        });
        if (!note) {
            res.status(404).json({ error: "Note not found" });
            return;
        }
        if (note.authorId !== userId) {
            res.status(403).json({ error: "Forbidden: Only the author can delete this note" });
            return;
        }
        await prisma_js_1.prisma.note.delete({
            where: { id: noteId },
        });
        res.json({ message: "Note deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete note" });
    }
});
exports.notesRouter.post("/:id/share", async (req, res) => {
    const noteId = req.params.id;
    const userId = req.user.userId;
    const parseResult = shareNoteSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.flatten() });
        return;
    }
    const { identifier, canEdit } = parseResult.data;
    try {
        const note = await prisma_js_1.prisma.note.findUnique({
            where: { id: noteId },
        });
        if (!note) {
            res.status(404).json({ error: "Note not found" });
            return;
        }
        if (note.authorId !== userId) {
            res.status(403).json({ error: "Forbidden: Only the author can share this note" });
            return;
        }
        const targetUser = await prisma_js_1.prisma.user.findFirst({
            where: {
                OR: [{ email: identifier }, { username: identifier }],
            },
        });
        if (!targetUser) {
            res.status(404).json({ error: "Target user not found" });
            return;
        }
        if (targetUser.id === userId) {
            res.status(400).json({ error: "Cannot share a note with yourself" });
            return;
        }
        const share = await prisma_js_1.prisma.noteShare.upsert({
            where: {
                noteId_userId: {
                    noteId,
                    userId: targetUser.id,
                },
            },
            create: {
                noteId,
                userId: targetUser.id,
                canEdit,
            },
            update: {
                canEdit,
            },
            include: {
                user: {
                    select: { id: true, username: true, email: true },
                },
            },
        });
        res.status(200).json({
            message: "Note shared successfully",
            share,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to share note" });
    }
});
