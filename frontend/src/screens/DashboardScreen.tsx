import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Lock,
  Globe,
  EyeOff,
  Trash2,
  Calendar,
  FileText,
} from "lucide-react";
import { apiRequest } from "../services/api";
import { Note } from "../types";
import { FloatingNavbar } from "../components/FloatingNavbar";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { NoteEditorScreen } from "./NoteEditorScreen";

interface NotesResponse {
  ownNotes: Note[];
  sharedNotes: Note[];
}

interface DashboardScreenProps {
  openNew?: boolean;
  viewNoteId?: string;
  onNewClose?: () => void;
  onOpenNew?: () => void;
  onOpenNote?: (id: string) => void;
  onNoteSaved?: (noteId: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  openNew = false,
  viewNoteId,
  onNewClose,
  onOpenNew,
  onOpenNote,
  onNoteSaved,
}) => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"own" | "shared">("own");
  const [selectedNote, setSelectedNote] = useState<Note | null | "new">(
    openNew ? "new" : null
  );
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  useEffect(() => {
    if (openNew) {
      setSelectedNote("new");
    } else if (!viewNoteId) {
      setSelectedNote(null);
    }
  }, [openNew, viewNoteId]);

  const { data, isLoading } = useQuery<NotesResponse>({
    queryKey: ["notes"],
    queryFn: () => apiRequest<NotesResponse>("/notes"),
  });

  useEffect(() => {
    if (viewNoteId && data) {
      const found =
        data.ownNotes.find((n) => n.id === viewNoteId) ||
        data.sharedNotes.find((n) => n.id === viewNoteId);
      if (found) setSelectedNote(found);
    }
  }, [viewNoteId, data]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/notes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const handleDelete = (note: Note) => {
    setDeleteTarget(note);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleCreateNote = () => {
    if (onOpenNew) onOpenNew();
    else setSelectedNote("new");
  };

  const handleEditorClose = () => {
    if (onNewClose) onNewClose();
    else setSelectedNote(null);
  };

  const handleEditorSaved = (noteId: string) => {
    queryClient.invalidateQueries({ queryKey: ["notes"] });
    if (onNoteSaved) onNoteSaved(noteId);
    else setSelectedNote(null);
  };

  if (selectedNote !== null) {
    return (
      <NoteEditorScreen
        note={selectedNote === "new" ? null : selectedNote}
        onClose={handleEditorClose}
        onSaved={handleEditorSaved}
      />
    );
  }

  if (viewNoteId && isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  const renderBadge = (item: Note) => {
    if (item.visibility === "PUBLIC") {
      return (
        <View style={[styles.badge, styles.badgePublic]}>
          <Globe size={11} color="#10b981" />
          <Text style={[styles.badgeText, { color: "#34d399" }]}>Publique</Text>
        </View>
      );
    }
    if (item.visibility === "PROTECTED") {
      return (
        <View style={[styles.badge, styles.badgeProtected]}>
          <Lock size={11} color="#f59e0b" />
          <Text style={[styles.badgeText, { color: "#fbbf24" }]}>Protégée</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, styles.badgePrivate]}>
        <EyeOff size={11} color="#71717a" />
        <Text style={[styles.badgeText, { color: "#a1a1aa" }]}>Privée</Text>
      </View>
    );
  };

  const notesList =
    activeTab === "own" ? data?.ownNotes || [] : data?.sharedNotes || [];

  return (
    <View style={styles.container}>
      <FloatingNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        ownCount={data?.ownNotes?.length || 0}
        sharedCount={data?.sharedNotes?.length || 0}
        onCreateNote={handleCreateNote}
      />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : (
        <FlatList
          data={notesList}
          keyExtractor={(item: Note) => item.id}
          contentContainerStyle={[
            styles.listContent,
            notesList.length === 0 && styles.listContentEmpty,
          ]}
          renderItem={({ item }: { item: Note }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => {
                if (onOpenNote) onOpenNote(item.id);
                else setSelectedNote(item);
              }}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {renderBadge(item)}
              </View>

              <Text style={styles.cardExcerpt} numberOfLines={2}>
                {item.content ? item.content : "Aucun contenu rédigé pour le moment..."}
              </Text>

              <View style={styles.cardBottom}>
                <View style={styles.metaRow}>
                  <Calendar size={12} color="#71717a" />
                  <Text style={styles.dateText}>
                    {new Date(item.updatedAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </Text>
                </View>

                <View style={styles.actionRow}>
                  {!item.isOwner && item.canEdit ? (
                    <View style={styles.collabPill}>
                      <Text style={styles.collabPillText}>Édition autorisée</Text>
                    </View>
                  ) : null}
                  {item.isOwner ? (
                    <TouchableOpacity
                      style={styles.trashBtn}
                      onPress={(e: any) => {
                        e.stopPropagation?.();
                        handleDelete(item);
                      }}
                    >
                      <Trash2 size={13} color="#71717a" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <FileText size={26} color="#71717a" />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === "own" ? "Aucune note créée" : "Aucune note partagée avec vous"}
              </Text>
              <Text style={styles.emptyDesc}>
                {activeTab === "own"
                  ? "Créez votre première note privée, publique ou protégée."
                  : "Les notes partagées par d'autres membres apparaîtront ici."}
              </Text>
              {activeTab === "own" ? (
                <TouchableOpacity
                  style={styles.emptyCta}
                  activeOpacity={0.85}
                  onPress={handleCreateNote}
                >
                  <Plus size={14} color="#09090b" strokeWidth={2.5} />
                  <Text style={styles.emptyCtaText}>Créer une note</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}

      {deleteTarget ? (
        <ConfirmDeleteModal
          title={deleteTarget.title}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, zIndex: 10 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 960,
    width: "100%",
    alignSelf: "center",
  },
  listContentEmpty: { flex: 1 },
  card: {
    backgroundColor: "rgba(18, 18, 22, 0.7)",
    backdropFilter: "blur(12px)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    boxShadow: "0 10px 25px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
  } as any,
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fafafa",
    letterSpacing: -0.2,
    flex: 1,
    marginRight: 12,
  },
  cardExcerpt: { fontSize: 13, color: "#a1a1aa", lineHeight: 19, marginBottom: 16 },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dateText: { fontSize: 12, color: "#71717a" },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  badgePrivate: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  badgePublic: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  badgeProtected: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
  },
  badgeText: { fontSize: 11, fontWeight: "600" },
  collabPill: {
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  collabPillText: { color: "#c4b5fd", fontSize: 11, fontWeight: "600" },
  trashBtn: { padding: 6, borderRadius: 8, backgroundColor: "rgba(255, 255, 255, 0.03)" },
  emptyContainer: {
    flex: 1,
    minHeight: 400,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  emptyIconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#fafafa" },
  emptyDesc: { fontSize: 13, color: "#71717a", textAlign: "center", maxWidth: 300 },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#fafafa",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
    marginTop: 6,
    boxShadow: "0 0 15px rgba(255, 255, 255, 0.12)",
  } as any,
  emptyCtaText: { color: "#09090b", fontSize: 13, fontWeight: "700" },
});
