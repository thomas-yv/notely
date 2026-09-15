import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/auth.js";

export const notesRouter = Router();

notesRouter.use(authMiddleware);

const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().default(""),
  visibility: z.enum(["PRIVATE", "PUBLIC", "PROTECTED"]).default("PRIVATE"),
  password: z.string().optional(),
}).refine(
  (data) => {
    if (data.visibility === "PROTECTED") {
      return !!data.password && data.password.trim().length > 0;
    }
    return true;
  },
  {
    message: "Password is required for PROTECTED notes",
    path: ["password"],
  }
);

const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  visibility: z.enum(["PRIVATE", "PUBLIC", "PROTECTED"]).optional(),
  password: z.string().optional(),
});

const shareNoteSchema = z.object({
  identifier: z.string().min(1),
  canEdit: z.boolean().default(false),
});

notesRouter.get("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  try {
    const ownNotes = await prisma.note.findMany({
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

    const sharedNotes = await prisma.note.findMany({
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

    const sanitizedOwnNotes = ownNotes.map((note: any) => {
      const { passwordHash, ...rest } = note;
      return {
        ...rest,
        isOwner: true,
        canEdit: true,
        hasPassword: !!passwordHash,
      };
    });

    const sanitizedSharedNotes = sharedNotes.map((note: any) => {
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
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

notesRouter.post("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const parseResult = createNoteSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.flatten() });
    return;
  }

  const { title, content, visibility, password } = parseResult.data;
  const userId = req.user!.userId;

  try {
    let passwordHash: string | null = null;
    if (visibility === "PROTECTED" && password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const note = await prisma.note.create({
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
  } catch (error) {
    res.status(500).json({ error: "Failed to create note" });
  }
});

notesRouter.put("/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const noteId = req.params.id;
  const userId = req.user!.userId;

  const parseResult = updateNoteSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.flatten() });
    return;
  }

  try {
    const note = await prisma.note.findUnique({
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
    const updateData: {
      title?: string;
      content?: string;
      visibility?: string;
      passwordHash?: string | null;
    } = {};

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;

    if (isAuthor && visibility !== undefined) {
      updateData.visibility = visibility;
      if (visibility === "PROTECTED") {
        if (password) {
          updateData.passwordHash = await bcrypt.hash(password, 10);
        } else if (!note.passwordHash) {
          res.status(400).json({ error: "Password required when switching to PROTECTED" });
          return;
        }
      } else {
        updateData.passwordHash = null;
      }
    } else if (isAuthor && password && note.visibility === "PROTECTED") {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedNote = await prisma.note.update({
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
  } catch (error) {
    res.status(500).json({ error: "Failed to update note" });
  }
});

notesRouter.delete("/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const noteId = req.params.id;
  const userId = req.user!.userId;

  try {
    const note = await prisma.note.findUnique({
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

    await prisma.note.delete({
      where: { id: noteId },
    });

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete note" });
  }
});

notesRouter.post("/:id/share", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const noteId = req.params.id;
  const userId = req.user!.userId;

  const parseResult = shareNoteSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.flatten() });
    return;
  }

  const { identifier, canEdit } = parseResult.data;

  try {
    const note = await prisma.note.findUnique({
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

    const targetUser = await prisma.user.findFirst({
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

    const share = await prisma.noteShare.upsert({
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
  } catch (error) {
    res.status(500).json({ error: "Failed to share note" });
  }
});
