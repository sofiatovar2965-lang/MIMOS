import { supabase } from "../config/supabase.js";
import { obtenerUsuarioPorId } from "./User.js";

//Crear codigo de recuperacion
export const crearCodigoDeRecuperacion = async (usuarioId, codigo) => {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); //Expira en 15 minutos

    const { data,error } = await supabase
        .from('recovery_codes')
        .insert({
            usuario_id: usuarioId,
            codigo: codigo,
            expires_at: expiresAt.toISOString()
        })
        .select();
    return { data, error };
};

//obtener codigo no utilizado por el usuario
export const obtenerCodigoValido = async (usuarioId, codigo) => {
    const { data,error } = await supabase
        .from('recovery_codes')
        .select('*')
        .eq('usuario_id', usuarioId)
        .eq('codigo', codigo)
        .eq('usado', false)
        .gt('expires_at', new Date().toISOString())
        .single();

    return { data, error };
};

//Marcar codigo como usado
export const marcarComoUsado = async (codigoId) => {

    const { data,error } = await supabase
        .from('recovery_codes')
        .update({ usado: true })
        .eq('id', codigoId)

    return { data, error };
};