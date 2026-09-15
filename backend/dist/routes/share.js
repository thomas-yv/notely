"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shareRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const prisma_js_1 = require("../lib/prisma.js");
exports.shareRouter = (0, express_1.Router)();
const unlockSchema = zod_1.z.object({
    password: zod_1.z.string().min(1),
});
exports.shareRouter.get("/:shareToken", async (req, res) => {
    const { shareToken } = req.params;
    try {
        const note = await prisma_js_1.prisma.note.findUnique({
            where: { shareToken },
            select: {
                id: true,
                title: true,
                content: true,
                visibility: true,
                passwordHash: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!note) {
            res.status(404).json({ error: "Note not found" });
            return;
        }
        if (note.visibility === "PRIVATE") {
            res.status(403).json({ error: "This note is private" });
            return;
        }
        if (note.visibility === "PUBLIC") {
            res.json({
                id: note.id,
                title: note.title,
                content: note.content,
                visibility: note.visibility,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
            });
            return;
        }
        if (note.visibility === "PROTECTED") {
            res.json({
                id: note.id,
                title: note.title,
                visibility: note.visibility,
                isProtected: true,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
            });
            return;
        }
        res.status(400).json({ error: "Invalid note visibility status" });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.shareRouter.post("/:shareToken/unlock", async (req, res) => {
    const { shareToken } = req.params;
    const parseResult = unlockSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: "Password is required" });
        return;
    }
    const { password } = parseResult.data;
    try {
        const note = await prisma_js_1.prisma.note.findUnique({
            where: { shareToken },
        });
        if (!note) {
            res.status(404).json({ error: "Note not found" });
            return;
        }
        if (note.visibility !== "PROTECTED") {
            res.status(400).json({ error: "This note is not password-protected" });
            return;
        }
        if (!note.passwordHash) {
            res.status(500).json({ error: "Corrupt note data: missing password hash" });
            return;
        }
        const isValid = await bcryptjs_1.default.compare(password, note.passwordHash);
        if (!isValid) {
            res.status(401).json({ error: "Invalid password" });
            return;
        }
        res.json({
            title: note.title,
            content: note.content,
            visibility: note.visibility,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
