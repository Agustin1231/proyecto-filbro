export type MetricaType =
  | "presion_sistolica"
  | "presion_diastolica"
  | "frecuencia_cardiaca"
  | "peso"
  | "glucosa"
  | "colesterol_total"
  | "horas_sueno"
  | "nivel_estres";

export type HabitoTipo =
  | "ejercicio"
  | "alimentacion"
  | "sueno"
  | "medicamento"
  | "hidratacion";

export interface Database {
  public: {
    Tables: {
      metricas: {
        Row: {
          id:         string;
          uid:        string;        // UUID anónimo del usuario
          tipo:       MetricaType;
          valor:      number;
          unidad:     string;
          notas:      string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["metricas"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["metricas"]["Insert"]>;
      };
      habitos: {
        Row: {
          id:         string;
          uid:        string;
          fecha:      string;        // YYYY-MM-DD
          tipo:       HabitoTipo;
          completado: boolean;
          notas:      string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["habitos"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["habitos"]["Insert"]>;
      };
      recetas_guardadas: {
        Row: {
          id:          string;
          uid:         string;
          titulo:      string;
          contenido:   string;       // markdown de la receta
          imagen_url:  string | null;
          ingredientes: string[];
          created_at:  string;
        };
        Insert: Omit<Database["public"]["Tables"]["recetas_guardadas"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["recetas_guardadas"]["Insert"]>;
      };
      rutinas: {
        Row: {
          id:          string;
          uid:         string;
          nombre:      string;
          contenido:   string;       // JSON stringificado del plan
          activa:      boolean;
          created_at:  string;
        };
        Insert: Omit<Database["public"]["Tables"]["rutinas"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["rutinas"]["Insert"]>;
      };
      perfil_usuario: {
        Row: {
          uid:             string;   // PK = UUID anónimo
          edad:            number | null;
          genero:          string | null;
          condicion_fisica: string | null;
          objetivos:       string[] | null;
          disclaimer_ok:   boolean;
          updated_at:      string;
        };
        Insert: Omit<Database["public"]["Tables"]["perfil_usuario"]["Row"], "updated_at">;
        Update: Partial<Database["public"]["Tables"]["perfil_usuario"]["Insert"]>;
      };
    };
  };
}
