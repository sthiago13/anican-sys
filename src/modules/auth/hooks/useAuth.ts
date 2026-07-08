import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../../../config/supabase";
import { type User } from "@supabase/supabase-js";

export interface Perfil {
  id: string;
  nombres: string;
  rol: string;
  created_at?: string;
}

interface AuthContextType {
  isAuthenticated: boolean | null;
  user: User | null;
  perfil: Perfil | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: null,
  user: null,
  perfil: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPerfil = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.warn("Perfil no encontrado para el usuario:", userId, error.message);
        setPerfil(null);
      } else {
        setPerfil(data as Perfil);
      }
    } catch (err) {
      console.error("Error inesperado al buscar perfil:", err);
      setPerfil(null);
    }
  };

  useEffect(() => {
    // 1. Verificar sesión actual
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setIsAuthenticated(true);
        await fetchPerfil(session.user.id);
      } else {
        setUser(null);
        setPerfil(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    // 2. Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true);
      if (session) {
        setUser(session.user);
        setIsAuthenticated(true);
        await fetchPerfil(session.user.id);
      } else {
        setUser(null);
        setPerfil(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return React.createElement(
    AuthContext.Provider,
    { value: { isAuthenticated, user, perfil, loading } },
    children
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
