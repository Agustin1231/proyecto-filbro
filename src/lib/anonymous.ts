import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "pulso_uid";

/**
 * Obtiene el UUID anónimo del usuario.
 * Si no existe lo genera y lo persiste en localStorage.
 * Solo se llama en el cliente.
 */
export function getAnonymousId(): string {
  if (typeof window === "undefined") return "";
  let uid = localStorage.getItem(STORAGE_KEY);
  if (!uid) {
    uid = uuidv4();
    localStorage.setItem(STORAGE_KEY, uid);
  }
  return uid;
}

/**
 * Verifica si el usuario ya aceptó el disclaimer médico.
 */
export function hasAcceptedDisclaimer(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("pulso_disclaimer") === "true";
}

/**
 * Marca el disclaimer como aceptado.
 */
export function acceptDisclaimer(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("pulso_disclaimer", "true");
  // Asegurar que el UUID existe desde el primer uso
  getAnonymousId();
}
