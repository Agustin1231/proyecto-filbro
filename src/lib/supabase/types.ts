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
          uid:        string;
          tipo:       MetricaType;
          valor:      number;
          unidad:     string;
          notas:      string | null;
          created_at: string;
        };
        Insert: {
          id?:        string;
          uid:        string;
          tipo:       MetricaType;
          valor:      number;
          unidad:     string;
          notas?:     string | null;
          created_at?: string;
        };
        Update: {
          uid?:       string;
          tipo?:      MetricaType;
          valor?:     number;
          unidad?:    string;
          notas?:     string | null;
        };
      };
      habitos: {
        Row: {
          id:         string;
          uid:        string;
          fecha:      string;
          tipo:       HabitoTipo;
          completado: boolean;
          notas:      string | null;
          created_at: string;
        };
        Insert: {
          id?:        string;
          uid:        string;
          fecha:      string;
          tipo:       HabitoTipo;
          completado?: boolean;
          notas?:     string | null;
          created_at?: string;
        };
        Update: {
          completado?: boolean;
          notas?:     string | null;
        };
      };
      recetas_guardadas: {
        Row: {
          id:           string;
          uid:          string;
          titulo:       string;
          contenido:    string;
          imagen_url:   string | null;
          ingredientes: string[];
          created_at:   string;
        };
        Insert: {
          id?:          string;
          uid:          string;
          titulo:       string;
          contenido:    string;
          imagen_url?:  string | null;
          ingredientes?: string[];
          created_at?:  string;
        };
        Update: {
          titulo?:      string;
          contenido?:   string;
          imagen_url?:  string | null;
          ingredientes?: string[];
        };
      };
      rutinas: {
        Row: {
          id:          string;
          uid:         string;
          nombre:      string;
          contenido:   unknown;
          activa:      boolean;
          created_at:  string;
        };
        Insert: {
          id?:         string;
          uid:         string;
          nombre:      string;
          contenido:   unknown;
          activa?:     boolean;
          created_at?: string;
        };
        Update: {
          nombre?:     string;
          contenido?:  unknown;
          activa?:     boolean;
        };
      };
      perfil_usuario: {
        Row: {
          uid:              string;
          edad:             number | null;
          genero:           string | null;
          condicion_fisica: string | null;
          objetivos:        string[] | null;
          disclaimer_ok:    boolean;
          updated_at:       string;
        };
        Insert: {
          uid:              string;
          edad?:            number | null;
          genero?:          string | null;
          condicion_fisica?: string | null;
          objetivos?:       string[] | null;
          disclaimer_ok?:   boolean;
          updated_at?:      string;
        };
        Update: {
          edad?:            number | null;
          genero?:          string | null;
          condicion_fisica?: string | null;
          objetivos?:       string[] | null;
          disclaimer_ok?:   boolean;
        };
      };
    };
  };
}
