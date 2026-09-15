import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Lock, ArrowRight, ShieldAlert, KeyRound } from "lucide-react";
import { PublicNoteResponse } from "../types";

interface PublicViewScreenProps {
  shareToken: string;
  onExit: () => void;
}

export const PublicViewScreen: React.FC<PublicViewScreenProps> = ({
  shareToken,
  onExit,
}) => {
  const [noteData, setNoteData] = useState<PublicNoteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const fetchPublicNote = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/share/${shareToken}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible de charger la note");
      }

      setNoteData(data);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicNote();
  }, [shareToken]);

  const handleUnlock = async () => {
    if (!password) {
      setUnlockError("Veuillez saisir un mot de passe");
      return;
    }

    try {
      setUnlockLoading(true);
      setUnlockError(null);
      const res = await fetch(`/api/share/${shareToken}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Mot de passe erroné");
      }

      setNoteData((prev) => ({
        ...prev,
        ...data,
        isProtected: false,
      }));
    } catch (err: any) {
      setUnlockError(err.message || "Mot de passe invalide");
    } finally {
      setUnlockLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerBox}>
        <View style={styles.dialogCard}>
          <View style={styles.errorPill}>
            <ShieldAlert size={16} color="#fb7185" />
          </View>
          <Text style={styles.dialogTitle}>Accès indisponible</Text>
          <Text style={styles.dialogDesc}>{error}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={onExit}>
            <Text style={styles.primaryButtonText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.navWrapper}>
        <View style={styles.floatingNavbar}>
          <Text style={styles.brandText}>Notely</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollArea}>
        <View style={styles.contentWrap}>
          <Text style={styles.noteTitle}>{noteData?.title}</Text>

          {noteData?.isProtected ? (
            <View style={styles.lockBox}>
              <View style={styles.lockIconWrap}>
                <KeyRound size={26} color="#fbbf24" />
              </View>
              <Text style={styles.lockTitle}>Note protégée par un mot de passe</Text>
              <Text style={styles.lockDesc}>
                Cette note nécessite une clé d'accès définie par son auteur.
              </Text>

              {unlockError ? (
                <View style={styles.errorBox}>
                  <ShieldAlert size={14} color="#fb7185" />
                  <Text style={styles.errorBoxText}>{unlockError}</Text>
                </View>
              ) : null}

              <View style={styles.inputRow}>
                <Lock size={15} color="#71717a" style={styles.fieldIcon} />
                <TextInput
                  style={styles.fieldInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mot de passe confidentiel"
                  placeholderTextColor="#52525b"
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.unlockButton, unlockLoading && styles.buttonDisabled]}
                onPress={handleUnlock}
                disabled={unlockLoading}
              >
                {unlockLoading ? (
                  <ActivityIndicator color="#09090b" size="small" />
                ) : (
                  <View style={styles.btnInner}>
                    <Text style={styles.unlockButtonText}>Déverrouiller</Text>
                    <ArrowRight size={15} color="#09090b" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noteCard}>
              <Text style={styles.noteBodyText}>{noteData?.content}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 10,
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 10,
  },
  navWrapper: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: "center",
    zIndex: 50,
  },
  floatingNavbar: {
    width: "100%",
    maxWidth: 960,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(18, 18, 22, 0.75)",
    backdropFilter: "blur(16px)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    boxShadow: "0 20px 40px -15px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
  } as any,
  brandText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fafafa",
    letterSpacing: -0.2,
  },
  scrollArea: {
    padding: 24,
    alignItems: "center",
  },
  contentWrap: {
    width: "100%",
    maxWidth: 780,
    gap: 20,
  },
  noteTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fafafa",
    letterSpacing: -0.5,
  },
  noteCard: {
    backgroundColor: "rgba(18, 18, 23, 0.6)",
    backdropFilter: "blur(16px)",
    borderRadius: 18,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  } as any,
  noteBodyText: {
    color: "#e4e4e7",
    fontSize: 15,
    lineHeight: 25,
    whiteSpace: "pre-wrap",
  } as any,
  lockBox: {
    backgroundColor: "rgba(18, 18, 23, 0.75)",
    backdropFilter: "blur(16px)",
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    gap: 12,
  } as any,
  lockIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  lockTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fafafa",
  },
  lockDesc: {
    fontSize: 13,
    color: "#a1a1aa",
    textAlign: "center",
    maxWidth: 380,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 14,
    width: "100%",
    maxWidth: 380,
  },
  fieldIcon: {
    marginRight: 8,
  },
  fieldInput: {
    flex: 1,
    paddingVertical: 10,
    color: "#fafafa",
    fontSize: 13,
    outlineStyle: "none",
  } as any,
  unlockButton: {
    backgroundColor: "#fafafa",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 380,
    marginTop: 4,
  },
  btnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unlockButtonText: {
    color: "#09090b",
    fontSize: 13,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
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
    width: "100%",
    maxWidth: 380,
  },
  errorBoxText: {
    color: "#fb7185",
    fontSize: 12,
    fontWeight: "500",
  },
  dialogCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(18, 18, 23, 0.9)",
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    gap: 10,
  },
  errorPill: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(244, 63, 94, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fafafa",
  },
  dialogDesc: {
    fontSize: 13,
    color: "#a1a1aa",
    textAlign: "center",
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: "#fafafa",
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#09090b",
    fontSize: 13,
    fontWeight: "700",
  },
});
