import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./store/authStore";
import { AuthScreen } from "./screens/AuthScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { PublicViewScreen } from "./screens/PublicViewScreen";

const queryClient = new QueryClient();

type Route =
  | { type: "auth" }
  | { type: "dashboard" }
  | { type: "new" }
  | { type: "note"; id: string }
  | { type: "share"; token: string };

function parseRoute(token: string | null): Route {
  const path = window.location.pathname;

  const shareMatch = path.match(/^\/share\/([^/]+)$/);
  if (shareMatch) return { type: "share", token: shareMatch[1] };

  const noteMatch = path.match(/^\/notes\/([^/]+)$/);
  if (noteMatch && token) return { type: "note", id: noteMatch[1] };

  if (path === "/new" && token) return { type: "new" };
  if (token) return { type: "dashboard" };
  return { type: "auth" };
}

export const App: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const [route, setRoute] = useState<Route>(() => parseRoute(token));

  useEffect(() => {
    setRoute(parseRoute(token));
  }, [token]);

  useEffect(() => {
    const handlePopState = () => setRoute(parseRoute(token));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [token]);

  const navigate = (path: string) => {
    window.history.pushState({}, "", path);
    setRoute(parseRoute(token));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="bg-ambient" />
      <div className="bg-grid" />
      <View style={styles.container}>
        {route.type === "share" ? (
          <PublicViewScreen
            shareToken={route.token}
            onExit={() => navigate("/")}
          />
        ) : !token ? (
          <AuthScreen />
        ) : route.type === "new" ? (
          <DashboardScreen
            openNew
            onNewClose={() => navigate("/")}
            onNoteSaved={(id) => navigate(`/notes/${id}`)}
            onOpenNew={() => navigate("/new")}
            onOpenNote={(id) => navigate(`/notes/${id}`)}
          />
        ) : route.type === "note" ? (
          <DashboardScreen
            viewNoteId={route.id}
            onNewClose={() => navigate("/")}
            onNoteSaved={(id) => navigate(`/notes/${id}`)}
            onOpenNew={() => navigate("/new")}
            onOpenNote={(id) => navigate(`/notes/${id}`)}
          />
        ) : (
          <DashboardScreen
            onOpenNew={() => navigate("/new")}
            onNoteSaved={(id) => navigate(`/notes/${id}`)}
            onOpenNote={(id) => navigate(`/notes/${id}`)}
          />
        )}
      </View>
    </QueryClientProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    width: "100%",
    height: "100%",
  },
});
