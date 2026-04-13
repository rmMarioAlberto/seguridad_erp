export interface GroupMember {
  id: number;
  nombre_completo: string;
  username: string;
  email?: string;
  permisos?: string[];
}

export interface Group {
  id?: number;
  nivel: string;
  autor: string;
  nombre: string;
  integrantes: number;
  tickets: number;
  descripcion: string;
  creador_id?: number;
  miembros?: GroupMember[];
}
