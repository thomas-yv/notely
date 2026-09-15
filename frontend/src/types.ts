export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export type Visibility = "PRIVATE" | "PUBLIC" | "PROTECTED";

export interface NoteShare {
  id: string;
  noteId: string;
  userId: string;
  canEdit: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface Note {
  id: string;
  title: string;
  content: string;
  visibility: Visibility;
  shareToken: string;
  authorId?: string;
  author?: {
    id: string;
    username: string;
    email: string;
  };
  shares?: NoteShare[];
  createdAt: string;
  updatedAt: string;
  isOwner?: boolean;
  canEdit?: boolean;
  hasPassword?: boolean;
}

export interface PublicNoteResponse {
  id?: string;
  title: string;
  content?: string;
  visibility: Visibility;
  isProtected?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
