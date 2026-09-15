import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Trash2 } from "lucide-react";

interface ConfirmDeleteModalProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  title,
  onConfirm,
  onCancel,
}) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.iconWrap}>
          <Trash2 size={20} color="#f43f5e" />
        </View>

        <Text style={styles.heading}>Supprimer la note</Text>
        <Text style={styles.body}>
          Vous êtes sur le point de supprimer{" "}
          <Text style={styles.noteName}>"{title}"</Text>. Cette action est
          irréversible.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={onConfirm}>
            <Trash2 size={14} color="#fff" />
            <Text style={styles.deleteBtnText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(8px)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 200,
  } as any,
  modal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgba(18, 18, 22, 0.97)",
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.9)",
  } as any,
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(244, 63, 94, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  heading: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fafafa",
  },
  body: {
    fontSize: 13,
    color: "#a1a1aa",
    textAlign: "center",
    lineHeight: 19,
  },
  noteName: {
    color: "#fafafa",
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#a1a1aa",
    fontSize: 13,
    fontWeight: "600",
  },
  deleteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f43f5e",
    boxShadow: "0 0 20px rgba(244, 63, 94, 0.3)",
  } as any,
  deleteBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});
