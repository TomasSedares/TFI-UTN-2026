
export enum EstadoTransaccion {
    SOLICITAR = 'SOLICITAR',
    RESERVA = 'RESERVA',
    SENIADO = 'SENIADO',
    VENDIDO = 'VENDIDO',
    CANCELADO = 'CANCELADO',
}

export enum MetodoPago {
    EFECTIVO = 'EFECTIVO',
    TRANSFERENCIA = 'TRANSFERENCIA',
    PLAN_AHORRO = 'PLAN_AHORRO',
    CUOTA_BANCARIZADA = 'CUOTA_BANCARIZADA',
}

export const ETIQUETA_ESTADO: Record<EstadoTransaccion, string> = {
  [EstadoTransaccion.SOLICITAR]: 'Solicitada',
  [EstadoTransaccion.RESERVA]: 'Reserva',
  [EstadoTransaccion.SENIADO]: 'Señada',
  [EstadoTransaccion.VENDIDO]: 'Vendida',
  [EstadoTransaccion.CANCELADO]: 'Cancelada',
};

export const ETIQUETA_METODO_PAGO: Record<MetodoPago, string> = {
  [MetodoPago.EFECTIVO]: 'Efectivo',
  [MetodoPago.TRANSFERENCIA]: 'Transferencia',
  [MetodoPago.PLAN_AHORRO]: 'Plan de ahorro',
  [MetodoPago.CUOTA_BANCARIZADA]: 'Cuota bancarizada',
};

export const ETIQUETA_SOLICITUD = {
  sinAsignar: 'Sin asignar',
  asignada: 'Asignada',
  visita: 'Visita',
};

export const SIN_OBSERVACIONES = 'Sin observaciones';

export interface Transaccion {
    id: number;
    observaciones: string | null;
    precio_final: number | null;
    metodoPago: MetodoPago | null;
    estadoTransaccion: EstadoTransaccion;
    vehiculo_id: number;
    marca: string;
    modelo: string;
    vehiculo_anio: number;
    patente: string;
    precio_vehiculo: number;
    total_pagado: number;
    pagos: Pago[];
    cliente_id: number;
    cliente_email: string;
    vendedor_id: number | null;
    vendedor_nombre: string;
    vendedor_apellido: string;
    vendedor_email: string | null;
    fecha_visita: string | null;
    fecha_venta: string | null;
}

export type TipoPago = 'SENIA' | 'VENTA';

export interface Pago {
    id: number;
    metodoPago: MetodoPago;
    monto: number;
    tipo: TipoPago;
    fecha: string;
}

export interface PagoRequest {
    metodoPago: MetodoPago;
    monto: number;
}

export interface FiltrosTransaccion {
    estadoTransaccion?: EstadoTransaccion;
    fechaDesde?: string;
    fechaHasta?: string;
}

export interface CrearTransaccion {
    observaciones?: string;
    metodoPago: MetodoPago;
    vehiculo_id: number;
    cliente_id: number;
    vendedor_id: number;
}

export interface SolicitarTransaccion {
    observaciones?: string;
    metodoPago?: MetodoPago;
    vehiculo_id: number;
}

export interface AsignarVisita {
    fechaVisita: string | null;
}

export interface ActualizarTransaccion extends CrearTransaccion {
    estadoTransaccion: EstadoTransaccion;
}

export interface BalanceTransacciones {
    precios_final_total: number;
    comisiones_total: number;
    costos_vehiculos_vendidos: number;
    ingreso_final: number;
    fecha_desde: string;
    fecha_hasta: string;
}

export interface VentaComision {
    transaccion_id: number;
    marca: string;
    modelo: string;
    anio: number;
    patente: string;
    fecha_venta: string;
    precio_final: number;
    comision: number;
}

export interface ComisionVendedor {
    id: number;
    ventas: VentaComision[];
    comision_total: number;
    vendedor_id: number;
    nombre_completo: string;
    email: string;
}

export interface AuditoriaTransaccion {
    id: number;
    transaccion_id: number;
    vendedor_id: number | null;
    created_at: string;
    precioFinalAnterior: number | null;
    precioFinalNuevo: number | null;
    metodoPagoAnterior: MetodoPago | null;
    metodoPagoNuevo: MetodoPago | null;
    estadoAnterior: EstadoTransaccion | null;
    estadoNuevo: EstadoTransaccion | null;
}

export interface FiltrosAuditoria {
    transaccionId?: number;
    vendedorId?: number;
    fechaDesde?: string;
    fechaHasta?: string;
    precioFinalAnterior?: number;
    precioFinalNuevo?: number;
    metodoPagoAnterior?: MetodoPago;
    metodoPagoNuevo?: MetodoPago;
    estadoAnterior?: EstadoTransaccion;
    estadoNuevo?: EstadoTransaccion;
}

export type AccionUsuario = 'ALTA' | 'BAJA' | 'REACTIVACION' | 'CAMBIO_ROL';

export const ETIQUETA_ACCION_USUARIO: Record<AccionUsuario, string> = {
  ALTA: 'Alta',
  BAJA: 'Baja',
  REACTIVACION: 'Reactivación',
  CAMBIO_ROL: 'Cambio de rol',
};

export interface AuditoriaUsuario {
    id: number;
    usuarioId: number;
    usuarioEmail: string;
    usuarioNombre: string;
    accion: AccionUsuario;
    realizadoPorEmail: string | null;
    fecha: string;
}
