import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { z } from "zod";
import { ArrowRight, Lock, Mail, User as UserIcon } from "lucide-react";
import { apiRequest } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { User } from "../types";

const loginValidationSchema = z.object({
  identifier: z.string().min(1, "Identifiant requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

const registerValidationSchema = z.object({
  email: z.string().email("Adresse email valide requise"),
  username: z.string().min(3, "Nom d'utilisateur d'au moins 3 caractères"),
  password: z.string().min(6, "Mot de passe d'au moins 6 caractères"),
});

interface AuthResponse {
  user: User;
  token: string;
}

export const AuthScreen: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async () => {
    setError(null);

    if (isRegister) {
      const result = registerValidationSchema.safeParse({
        email,
        username,
        password,
      });

      if (!result.success) {
        setError(result.error.errors[0]?.message || "Erreur de validation");
        return;
      }

      try {
        setLoading(true);
        const data = await apiRequest<AuthResponse>("/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, username, password }),
        });
        setAuth(data.user, data.token);
      } catch (err: any) {
        setError(err.message || "Échec de l'inscription");
      } finally {
        setLoading(false);
      }
    } else {
      const result = loginValidationSchema.safeParse({ identifier, password });

      if (!result.success) {
        setError(result.error.errors[0]?.message || "Erreur de validation");
        return;
      }

      try {
        setLoading(true);
        const data = await apiRequest<AuthResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ identifier, password }),
        });
        setAuth(data.user, data.token);
      } catch (err: any) {
        setError(err.message || "Identifiants incorrects");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.brandTitle}>Notely</Text>
          <Text style={styles.title}>
            {isRegister ? "Créer un compte" : "Bon retour"}
          </Text>
          <Text style={styles.subtitle}>
            {isRegister
              ? "Accédez à votre espace de prise de notes chiffré."
              : "Saisissez vos identifiants pour ouvrir votre coffre."}
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          {isRegister ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Adresse email</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={15} color="#71717a" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="nom@exemple.com"
                    placeholderTextColor="#52525b"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom d'utilisateur</Text>
                <View style={styles.inputWrapper}>
                  <UserIcon size={15} color="#71717a" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="pseudo"
                    placeholderTextColor="#52525b"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email ou nom d'utilisateur</Text>
              <View style={styles.inputWrapper}>
                <UserIcon size={15} color="#71717a" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={identifier}
                  onChangeText={setIdentifier}
                  placeholder="nom@exemple.com ou pseudo"
                  placeholderTextColor="#52525b"
                  autoCapitalize="none"
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputWrapper}>
              <Lock size={15} color="#71717a" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••••••"
                placeholderTextColor="#52525b"
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#09090b" size="small" />
            ) : (
              <View style={styles.buttonInner}>
                <Text style={styles.primaryButtonText}>
                  {isRegister ? "Créer mon espace" : "Se connecter"}
                </Text>
                <ArrowRight size={15} color="#09090b" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
          >
            <Text style={styles.switchText}>
              {isRegister
                ? "Vous avez déjà un compte ? "
                : "Pas encore de compte ? "}
              <Text style={styles.switchTextHighlight}>
                {isRegister ? "Se connecter" : "S'inscrire"}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 10,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgba(18, 18, 22, 0.85)",
    backdropFilter: "blur(20px)",
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)",
  } as any,
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#a1a1aa",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fafafa",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#71717a",
    marginTop: 6,
    textAlign: "center",
    lineHeight: 18,
  },
  form: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#d4d4d8",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    color: "#fafafa",
    fontSize: 13,
    outlineStyle: "none",
  } as any,
  primaryButton: {
    backgroundColor: "#fafafa",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    boxShadow: "0 0 20px rgba(255, 255, 255, 0.12)",
  } as any,
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#09090b",
    fontSize: 13,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  switchText: {
    fontSize: 13,
    color: "#71717a",
  },
  switchTextHighlight: {
    color: "#fafafa",
    fontWeight: "600",
  },
  errorBox: {
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.25)",
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: "#fb7185",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
  },
});
