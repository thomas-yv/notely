"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_js_1 = require("../lib/prisma.js");
exports.authRouter = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret_notely_key";
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    username: zod_1.z.string().min(3).max(30),
    password: zod_1.z.string().min(6),
});
const loginSchema = zod_1.z.object({
    identifier: zod_1.z.string().min(1),
    password: zod_1.z.string().min(1),
});
exports.authRouter.post("/register", async (req, res) => {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.flatten() });
        return;
    }
    const { email, username, password } = parseResult.data;
    try {
        const existingUser = await prisma_js_1.prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });
        if (existingUser) {
            res.status(409).json({ error: "Email or username already in use" });
            return;
        }
        const saltRounds = 10;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        const user = await prisma_js_1.prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
            },
            select: {
                id: true,
                email: true,
                username: true,
                createdAt: true,
            },
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({ user, token });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.authRouter.post("/login", async (req, res) => {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.flatten() });
        return;
    }
    const { identifier, password } = parseResult.data;
    try {
        const user = await prisma_js_1.prisma.user.findFirst({
            where: {
                OR: [{ email: identifier }, { username: identifier }],
            },
        });
        if (!user) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
        res.json({
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                createdAt: user.createdAt,
            },
            token,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
