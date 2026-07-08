import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../../../config/supabase";
import { type Perfil } from "../../auth/hooks/useAuth";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function useUsers() {
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("perfiles")
        .select("*")
        .order("nombres", { ascending: true });

      if (error) throw error;
      setUsuarios((data || []) as Perfil[]);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsuarios();
  }, []);

  const handleUpdateRole = async (userId: string, nuevoRol: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("perfiles")
        .update({ rol: nuevoRol })
        .eq("id", userId);

      if (error) throw error;
      await fetchUsuarios();
    } catch (err) {
      console.error("Error al actualizar rol de usuario:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (
    nombres: string,
    email: string,
    password: string,
    rol: "Administrador" | "Voluntario"
  ) => {
    setLoading(true);
    try {
      // 1. Instanciamos un cliente de Supabase temporal sin persistencia de sesión
      const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storage: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          },
        },
      });

      // 2. Registramos la cuenta en Supabase Auth
      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            nombres: nombres.trim(),
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario en Auth.");

      // 3. Insertar el perfil en public.perfiles
      const { error: perfilError } = await supabase
        .from("perfiles")
        .insert([
          {
            id: authData.user.id,
            nombres: nombres.trim(),
            rol: rol,
          },
        ]);

      if (perfilError) throw perfilError;

      await fetchUsuarios();
    } catch (err) {
      console.error("Error al crear usuario:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    usuarios,
    loading,
    fetchUsuarios,
    handleUpdateRole,
    handleCreateUser,
  };
}
