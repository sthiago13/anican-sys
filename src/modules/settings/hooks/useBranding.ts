import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../config/supabase';

export interface BrandingData {
  id: number;
  nombre_fundacion: string;
  rif: string;
  correo: string;
  telefono: string;
  telefono_2?: string;
  direccion: string;
  logo_url: string | null;
  favicon_url: string | null;
  updated_at?: string;
  updated_by?: string | null;
}

const DEFAULT_BRANDING: BrandingData = {
  id: 1,
  nombre_fundacion: 'Fundación Anican',
  rif: 'J-00000000-0',
  correo: 'contacto@anican.org',
  telefono: '',
  telefono_2: '',
  direccion: '',
  logo_url: null,
  favicon_url: null,
};

export function useBranding() {
  const [branding, setBranding] = useState<BrandingData>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranding = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from('configuracion_branding')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (fetchErr) {
        throw fetchErr;
      }

      if (data) {
        setBranding(data as BrandingData);
      }
    } catch (err: any) {
      console.error('Error al cargar la configuración de branding:', err);
      setError(err.message || 'Error al cargar la configuración de branding');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  // Actualizar favicon y document.title dinámicamente
  useEffect(() => {
    if (branding?.nombre_fundacion) {
      document.title = `${branding.nombre_fundacion} - Sistema de Gestión`;
    }

    if (branding?.favicon_url) {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = branding.favicon_url;
    }
  }, [branding]);

  const updateBranding = async (updatedFields: Partial<BrandingData>) => {
    try {
      setError(null);
      const { data: userData } = await supabase.auth.getUser();

      const payload = {
        ...updatedFields,
        updated_at: new Date().toISOString(),
        updated_by: userData?.user?.id || null,
      };

      const { data, error: updateErr } = await supabase
        .from('configuracion_branding')
        .update(payload)
        .eq('id', 1)
        .select()
        .single();

      if (updateErr) {
        throw updateErr;
      }

      if (data) {
        setBranding(data as BrandingData);
      }
      return data;
    } catch (err: any) {
      console.error('Error al actualizar branding:', err);
      throw new Error(err.message || 'No se pudo actualizar la configuración de branding.');
    }
  };

  const uploadImage = async (file: File, type: 'logo' | 'favicon'): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('branding')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600',
        });

      if (uploadErr) {
        throw uploadErr;
      }

      const { data: publicUrlData } = supabase.storage
        .from('branding')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // Actualizar la columna correspondiente en la base de datos
      const fieldToUpdate = type === 'logo' ? { logo_url: publicUrl } : { favicon_url: publicUrl };
      await updateBranding(fieldToUpdate);

      return publicUrl;
    } catch (err: any) {
      console.error(`Error al subir ${type}:`, err);
      throw new Error(err.message || `No se pudo subir la imagen de ${type}.`);
    }
  };

  return {
    branding,
    loading,
    error,
    refetch: fetchBranding,
    updateBranding,
    uploadImage,
  };
}
