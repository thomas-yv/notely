import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LogOut, Plus } from "lucide-react";
import { useAuthStore } from "../store/authStore";

interface FloatingNavbarProps {
  activeTab?: "own" | "shared";
  onTabChange?: (tab: "own" | "shared") => void;
  ownCount?: number;
  sharedCount?: number;
  onCreateNote?: () => void;
}

export const FloatingNavbar: React.FC<FloatingNavbarProps> = ({
  activeTab,
  onTabChange,
  ownCount = 0,
  sharedCount = 0,
  onCreateNote,
}) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <View style={styles.wrapper}>
      <View style={styles.navBar}>
        <View style={styles.brandGroup}>
          <Text style={styles.brandTitle}>Notely</Text>
        </View>

        {onTabChange ? (
          <View style={styles.tabsPill}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "own" && styles.tabActive]}
              onPress={() => onTabChange("own")}
            >
              <Text style={[styles.tabText, activeTab === "own" && styles.tabTextActive]}>
                Mes Notes
              </Text>
              <View style={[styles.badgeCount, activeTab === "own" && styles.badgeCountActive]}>
                <Text style={[styles.badgeCountText, activeTab === "own" && styles.badgeCountTextActive]}>
                  {ownCount}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === "shared" && styles.tabActive]}
              onPress={() => onTabChange("shared")}
            >
              <Text style={[styles.tabText, activeTab === "shared" && styles.tabTextActive]}>
                Partagées
              </Text>
              <View style={[styles.badgeCount, activeTab === "shared" && styles.badgeCountActive]}>
                <Text style={[styles.badgeCountText, activeTab === "shared" && styles.badgeCountTextActive]}>
                  {sharedCount}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.rightSection}>
          {onCreateNote ? (
            <TouchableOpacity
              style={styles.createButton}
              activeOpacity={0.8}
              onPress={onCreateNote}
            >
              <Plus size={14} color="#09090b" strokeWidth={2.5} />
              <Text style={styles.createButtonText}>Nouvelle note</Text>
            </TouchableOpacity>
          ) : null}

          {user ? (
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>
                  {user.username.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.userName} numberOfLines={1}>
                {user.username}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <LogOut size={14} color="#71717a" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: "center",
    zIndex: 50,
  },
  navBar: {
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
  brandGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fafafa",
    letterSpacing: -0.2,
  },
  brandSub: {
    fontSize: 10,
    color: "#71717a",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tabsPill: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    gap: 2,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
    gap: 6,
  },
  tabActive: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  tabText: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#fafafa",
    fontWeight: "600",
  },
  badgeCount: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 9999,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  badgeCountActive: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
  },
  badgeCountText: {
    color: "#71717a",
    fontSize: 10,
    fontWeight: "600",
  },
  badgeCountTextActive: {
    color: "#c4b5fd",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fafafa",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    boxShadow: "0 0 15px rgba(255, 255, 255, 0.12)",
  } as any,
  createButtonText: {
    color: "#09090b",
    fontSize: 12,
    fontWeight: "700",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
  },
  userAvatar: {
    width: 20,
    height: 20,
    borderRadius: 9999,
    backgroundColor: "rgba(139, 92, 246, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#c4b5fd",
    fontSize: 9,
    fontWeight: "700",
  },
  userName: {
    color: "#d4d4d8",
    fontSize: 12,
    fontWeight: "500",
    maxWidth: 80,
  },
  logoutBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
});
