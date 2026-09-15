import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { z } from "zod";
import {
  ArrowLeft,
  Share2,
  Lock,
  Globe,
  EyeOff,
  Copy,
  Check,
  X,
  UserPlus,
  ShieldAlert,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import { Note, Visibility } from "../types";
import { apiRequest } from "../services/api";

const noteValidationSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  content: z.string().default(""),
  visibility: z.enum(["PRIVATE", "PUBLIC", "PROTECTED"]),
  password: z.string().optional(),
}).refine(
  (data) => {
    if (data.visibility === "PROTECTED") {
      return !!data.password && data.password.trim().length > 0;
    }
    return true;
  },
  {
    message: "Un mot de passe est obligatoire pour les notes protégées",
    path: ["password"],
  }
);

interface NoteEditorScreenProps {
  note?: Note | null;
  onClose: () => void;
  onSaved: (noteId: string) => void;
}

export const NoteEditorScreen: React.FC<NoteEditorScreenProps> = ({
  note,
  onClose,
  onSaved,
}) => {
  const [title, setTitle] = useState(note ? note.title : "");
  const [content, setContent] = useState(note ? note.content : "");
  const [visibility, setVisibility] = useState<Visibility>(
    note ? note.visibility : "PRIVATE"
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareIdentifier, setShareIdentifier] = useState("");
  const [shareCanEdit, setShareCanEdit] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    setError(null);

    const validationPayload = {
      title,
      content,
      visibility,
      password: password || undefined,
    };

    if (!note || (note && visibility === "PROTECTED" && !note.hasPassword)) {
      const result = noteValidationSchema.safeParse(validationPayload);
      if (!result.success) {
        setError(result.error.errors[0]?.message || "Erreur de validation");
        return;
      }
    } else if (title.trim().length === 0) {
      setError("Le titre de la note ne peut pas être vide");
      return;
    }

    try {
      setLoading(true);
      let savedId: string;
      if (note) {
        const updated = await apiRequest<{ id: string }>(`/notes/${note.id}`, {
          method: "PUT",
          body: JSON.stringify({
            title,
            content,
            visibility,
            password: password ? password : undefined,
          }),
        });
        savedId = updated.id;
      } else {
        const created = await apiRequest<{ id: string }>("/notes", {
          method: "POST",
          body: JSON.stringify({
            title,
            content,
            visibility,
            password: password ? password : undefined,
          }),
        });
        savedId = created.id;
      }
      onSaved(savedId);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const handleShareWithUser = async () => {
    if (!note) return;
    setShareError(null);
    setShareStatus(null);

    if (!shareIdentifier.trim()) {
      setShareError("Veuillez renseigner un pseudo ou une adresse email");
      return;
    }

    try {
      setShareLoading(true);
      await apiRequest(`/notes/${note.id}/share`, {
        method: "POST",
        body: JSON.stringify({
          identifier: shareIdentifier.trim(),
          canEdit: shareCanEdit,
        }),
      });
      setShareStatus(`Note partagée avec succès avec ${shareIdentifier}`);
      setShareIdentifier("");
    } catch (err: any) {
      setShareError(err.message || "Impossible d'accorder le partage");
    } finally {
      setShareLoading(false);
    }
  };

  const copyPublicLink = () => {
    if (!note) return;
    const url = `${window.location.origin}/share/${note.shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const renderVisibilityPill = () => {
    if (visibility === "PUBLIC") {
      return (
        <View style={styles.pillActivePublic}>
          <Globe size={13} color="#10b981" />
          <Text style={styles.pillTextPublic}>Publique</Text>
        </View>
      );
    }
    if (visibility === "PROTECTED") {
      return (
        <View style={styles.pillActiveProtected}>
          <Lock size={13} color="#f59e0b" />
          <Text style={styles.pillTextProtected}>Protégée</Text>
        </View>
      );
    }
    return (
      <View style={styles.pillActivePrivate}>
        <EyeOff size={13} color="#a1a1aa" />
        <Text style={styles.pillTextPrivate}>Privée</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.navWrapper}>
        <View style={styles.floatingTopBar}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <ArrowLeft size={16} color="#a1a1aa" />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>

          <View style={styles.topBarRight}>
            {(!note || note.isOwner) ? (
              <TouchableOpacity
                style={styles.visibilityBtn}
                activeOpacity={0.8}
                onPress={() => setShowVisibilityModal(true)}
              >
                <SlidersHorizontal size={13} color="#a1a1aa" />
                {renderVisibilityPill()}
                <ChevronDown size={13} color="#71717a" />
              </TouchableOpacity>
            ) : null}

            {note && note.isOwner ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setShowShareModal(true)}
              >
                <Share2 size={14} color="#fafafa" />
                <Text style={styles.actionBtnText}>Partager</Text>
              </TouchableOpacity>
            ) : null}

            {(!note || note.canEdit) ? (
              <TouchableOpacity
                style={[styles.saveBtn, loading && styles.btnDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#09090b" />
                ) : (
                  <Text style={styles.saveBtnText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.editorBox}>
          {error ? (
            <View style={styles.alertBanner}>
              <ShieldAlert size={15} color="#fb7185" />
              <Text style={styles.alertBannerText}>{error}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Titre de la note..."
            placeholderTextColor="#52525b"
            editable={!note || note.canEdit}
          />

          <View style={styles.editorPaper}>
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder="Rédigez votre note en toute confidentialité..."
              placeholderTextColor="#52525b"
              multiline
              textAlignVertical="top"
              editable={!note || note.canEdit}
            />
          </View>
        </View>
      </ScrollView>

      {showVisibilityModal ? (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Confidentialité de la note</Text>
                <Text style={styles.modalSub}>
                  Choisissez qui a accès à ce contenu.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowVisibilityModal(false)}
              >
                <X size={15} color="#a1a1aa" />
              </TouchableOpacity>
            </View>

            <View style={styles.visibilityOptions}>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  visibility === "PRIVATE" && styles.optionCardSelected,
                ]}
                onPress={() => setVisibility("PRIVATE")}
              >
                <View style={styles.optionIconPrivate}>
                  <EyeOff size={16} color="#a1a1aa" />
                </View>
                <View style={styles.optionTextCol}>
                  <Text style={styles.optionTitle}>Privée</Text>
                  <Text style={styles.optionDesc}>
                    Visible uniquement par vous et vos collaborateurs invités.
                  </Text>
                </View>
                {visibility === "PRIVATE" ? (
                  <Check size={16} color="#fafafa" />
                ) : null}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  visibility === "PUBLIC" && styles.optionCardSelected,
                ]}
                onPress={() => setVisibility("PUBLIC")}
              >
                <View style={styles.optionIconPublic}>
                  <Globe size={16} color="#10b981" />
                </View>
                <View style={styles.optionTextCol}>
                  <Text style={styles.optionTitle}>Publique</Text>
                  <Text style={styles.optionDesc}>
                    Toute personne disposant du lien de partage peut la lire.
                  </Text>
                </View>
                {visibility === "PUBLIC" ? (
                  <Check size={16} color="#fafafa" />
                ) : null}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  visibility === "PROTECTED" && styles.optionCardSelected,
                ]}
                onPress={() => setVisibility("PROTECTED")}
              >
                <View style={styles.optionIconProtected}>
                  <Lock size={16} color="#f59e0b" />
                </View>
                <View style={styles.optionTextCol}>
                  <Text style={styles.optionTitle}>Protégée par mot de passe</Text>
                  <Text style={styles.optionDesc}>
                    Le contenu est chiffré et exige un code d'accès pour être lu.
                  </Text>
                </View>
                {visibility === "PROTECTED" ? (
                  <Check size={16} color="#fafafa" />
                ) : null}
              </TouchableOpacity>
            </View>

            {visibility === "PROTECTED" ? (
              <View style={styles.passwordBlock}>
                <Text style={styles.passwordLabel}>
                  {note && note.hasPassword
                    ? "Modifier le mot de passe (facultatif)"
                    : "Définir le mot de passe d'accès"}
                </Text>
                <View style={styles.passwordInputWrap}>
                  <Lock size={14} color="#71717a" style={styles.passIcon} />
                  <TextInput
                    style={styles.passInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Saisissez un code confidentiel"
                    placeholderTextColor="#52525b"
                    secureTextEntry
                  />
                </View>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => setShowVisibilityModal(false)}
            >
              <Text style={styles.confirmBtnText}>Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {showShareModal ? (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Partage & Collaborateurs</Text>
                <Text style={styles.modalSub}>
                  Lien public de diffusion et invitation de membres.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowShareModal(false)}
              >
                <X size={15} color="#a1a1aa" />
              </TouchableOpacity>
            </View>

            {shareStatus ? (
              <View style={styles.statusBox}>
                <Check size={14} color="#34d399" />
                <Text style={styles.statusBoxText}>{shareStatus}</Text>
              </View>
            ) : null}

            {shareError ? (
              <View style={styles.errorBox}>
                <ShieldAlert size={14} color="#fb7185" />
                <Text style={styles.errorBoxText}>{shareError}</Text>
              </View>
            ) : null}

            <View style={styles.shareSection}>
              <Text style={styles.sectionHeading}>Lien direct de partage</Text>
              <Text style={styles.sectionDesc}>
                {note?.visibility === "PRIVATE"
                  ? "La note est actuellement privée. Ajustez la visibilité pour l'activer."
                  : note?.visibility === "PROTECTED"
                  ? "Le mot de passe sera demandé aux personnes ouvrant ce lien."
                  : "Accessible immédiatement par quiconque dispose de ce lien."}
              </Text>

              <TouchableOpacity
                style={styles.copyBtn}
                onPress={copyPublicLink}
              >
                {copied ? (
                  <Check size={14} color="#34d399" />
                ) : (
                  <Copy size={14} color="#fafafa" />
                )}
                <Text style={styles.copyBtnText}>
                  {copied ? "Lien copié dans le presse-papier" : "Copier le lien public"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.shareSection, { marginTop: 14 }]}>
              <Text style={styles.sectionHeading}>Inviter un utilisateur Notely</Text>
              <View style={styles.inviteInputWrap}>
                <UserPlus size={14} color="#71717a" style={styles.passIcon} />
                <TextInput
                  style={styles.passInput}
                  value={shareIdentifier}
                  onChangeText={setShareIdentifier}
                  placeholder="Pseudo ou adresse email"
                  placeholderTextColor="#52525b"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.checkRow}
                activeOpacity={0.8}
                onPress={() => setShareCanEdit(!shareCanEdit)}
              >
                <View
                  style={[
                    styles.checkboxSquare,
                    shareCanEdit && styles.checkboxSquareActive,
                  ]}
                >
                  {shareCanEdit ? <Check size={11} color="#fafafa" strokeWidth={3} /> : null}
                </View>
                <Text style={styles.checkLabel}>
                  Autoriser la modification (canEdit)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.inviteBtn,
                  shareLoading && styles.btnDisabled,
                ]}
                onPress={handleShareWithUser}
                disabled={shareLoading}
              >
                {shareLoading ? (
                  <ActivityIndicator color="#09090b" size="small" />
                ) : (
                  <Text style={styles.inviteBtnText}>Accorder les droits d'accès</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 10,
  },
  navWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: "center",
    zIndex: 50,
  },
  floatingTopBar: {
    width: "100%",
    maxWidth: 960,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(18, 18, 22, 0.75)",
    backdropFilter: "blur(16px)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    boxShadow: "0 20px 40px -15px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
  } as any,
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backText: {
    color: "#a1a1aa",
    fontSize: 13,
    fontWeight: "500",
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  visibilityBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  pillActivePrivate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  pillTextPrivate: {
    color: "#d4d4d8",
    fontSize: 12,
    fontWeight: "600",
  },
  pillActivePublic: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  pillTextPublic: {
    color: "#34d399",
    fontSize: 12,
    fontWeight: "600",
  },
  pillActiveProtected: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  pillTextProtected: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "600",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  actionBtnText: {
    color: "#fafafa",
    fontSize: 12,
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: "#fafafa",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  saveBtnText: {
    color: "#09090b",
    fontSize: 12,
    fontWeight: "700",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  scrollContent: {
    padding: 24,
    alignItems: "center",
  },
  editorBox: {
    width: "100%",
    maxWidth: 860,
    gap: 16,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.25)",
    padding: 10,
    borderRadius: 10,
  },
  alertBannerText: {
    color: "#fb7185",
    fontSize: 12,
    fontWeight: "500",
  },
  titleInput: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fafafa",
    paddingVertical: 8,
    letterSpacing: -0.5,
    outlineStyle: "none",
  } as any,
  editorPaper: {
    backgroundColor: "rgba(18, 18, 22, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 24,
    minHeight: 460,
  },
  contentInput: {
    color: "#e4e4e7",
    fontSize: 15,
    lineHeight: 25,
    minHeight: 440,
    outlineStyle: "none",
  } as any,
  modalOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(8px)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 100,
  } as any,
  modalBox: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "rgba(18, 18, 22, 0.95)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.9)",
  } as any,
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fafafa",
  },
  modalSub: {
    fontSize: 12,
    color: "#71717a",
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  visibilityOptions: {
    gap: 10,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  optionCardSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  optionIconPrivate: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconPublic: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconProtected: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionTextCol: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fafafa",
  },
  optionDesc: {
    fontSize: 11,
    color: "#71717a",
    marginTop: 2,
  },
  passwordBlock: {
    marginTop: 14,
    gap: 6,
  },
  passwordLabel: {
    fontSize: 12,
    color: "#d4d4d8",
    fontWeight: "500",
  },
  passwordInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  passIcon: {
    marginRight: 8,
  },
  passInput: {
    flex: 1,
    paddingVertical: 9,
    color: "#fafafa",
    fontSize: 13,
    outlineStyle: "none",
  } as any,
  confirmBtn: {
    backgroundColor: "#fafafa",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 16,
  },
  confirmBtnText: {
    color: "#09090b",
    fontSize: 13,
    fontWeight: "700",
  },
  shareSection: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    gap: 8,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fafafa",
  },
  sectionDesc: {
    fontSize: 11,
    color: "#71717a",
    lineHeight: 15,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginTop: 4,
  },
  copyBtnText: {
    color: "#fafafa",
    fontSize: 12,
    fontWeight: "600",
  },
  inviteInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 4,
  },
  checkboxSquare: {
    width: 17,
    height: 17,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSquareActive: {
    backgroundColor: "#8b5cf6",
    borderColor: "#8b5cf6",
  },
  checkLabel: {
    fontSize: 12,
    color: "#d4d4d8",
  },
  inviteBtn: {
    backgroundColor: "#fafafa",
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
  },
  inviteBtnText: {
    color: "#09090b",
    fontSize: 12,
    fontWeight: "700",
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  statusBoxText: {
    color: "#34d399",
    fontSize: 12,
    fontWeight: "500",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.25)",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  errorBoxText: {
    color: "#fb7185",
    fontSize: 12,
    fontWeight: "500",
  },
});
