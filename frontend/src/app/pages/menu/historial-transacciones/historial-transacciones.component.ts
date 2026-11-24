import { DatePipe, formatDate } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ScrollSuperiorDirective } from '../../../directives/scroll-superior.directive';
import {
  AccionUsuario,
  AuditoriaTransaccion,
  AuditoriaUsuario,
  ETIQUETA_ACCION_USUARIO,
  ETIQUETA_ESTADO,
  ETIQUETA_METODO_PAGO,
  EstadoTransaccion,
  FiltrosAuditoria,
  MetodoPago,
} from '../../../models/Transacciones';
import { Usuario } from '../../../models/Usuario';
import { Pagina } from '../../../models/Vehiculo';
import { AuditoriaService } from '../../../services/auditoria.service';
import { UsuarioService } from '../../../services/usuario.service';

interface FormularioFiltros {
  transaccionId: number | null;
  vendedorId: number | null;
  fechaDesde: Date | null;
  fechaHasta: Date | null;
  precioFinalAnterior: number | null;
  precioFinalNuevo: number | null;
  metodoPagoAnterior: MetodoPago | null;
  metodoPagoNuevo: MetodoPago | null;
  estadoAnterior: EstadoTransaccion | null;
  estadoNuevo: EstadoTransaccion | null;
}

const MSG = {
  errorCarga: 'No se pudo cargar el historial de transacciones.',
  errorVendedores: 'No se pudieron cargar los vendedores.',
  errorCargaUsuarios: 'No se pudo cargar el historial de usuarios.',
  rangoInvalido: 'La fecha desde no puede ser posterior a la fecha hasta.',
  valoresInvalidos: 'Los IDs deben ser positivos y los precios no pueden ser negativos.',
};

const SIN_DATO = 'Sin dato';

const SIN_CAMBIO = '-';

const FORMATO_FECHA_API = 'yyyy-MM-dd';

const FORMATO_PRECIO = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

@Component({
  imports: [
    DatePipe,
    FormsModule,
    MatButton,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTableModule,
    ScrollSuperiorDirective,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-AR' }, provideNativeDateAdapter()],
  selector: 'app-historial-transacciones',
  styleUrl: './historial-transacciones.component.scss',
  templateUrl: './historial-transacciones.component.html',
})
export class HistorialTransaccionesComponent {
  private readonly auditoriaService = inject(AuditoriaService);
  private readonly usuarioService = inject(UsuarioService);

  protected readonly estados = Object.values(EstadoTransaccion);
  protected readonly metodosPago = Object.values(MetodoPago);
  protected readonly etiquetaEstado = ETIQUETA_ESTADO;
  protected readonly etiquetaMetodoPago = ETIQUETA_METODO_PAGO;
  protected readonly columnas = ['fecha', 'vendedor', 'estado', 'precio', 'metodoPago'];
  protected readonly pageSize = 10;

  // Dos vistas: cambios de transacciones y altas/bajas de usuarios
  protected readonly vista = signal<'transacciones' | 'usuarios'>('transacciones');
  protected readonly columnasUsuarios = ['fecha', 'usuario', 'accion', 'realizadoPor'];
  protected readonly auditoriasUsuarios = signal<Pagina<AuditoriaUsuario> | null>(null);
  protected readonly cargandoUsuarios = signal(false);
  protected pageIndexUsuarios = 0;

  protected readonly auditorias = signal<Pagina<AuditoriaTransaccion> | null>(null);
  protected readonly vendedores = signal<Usuario[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal('');

  protected pageIndex = 0;
  protected filtros: FormularioFiltros = this.filtrosVacios();

  constructor() {
    this.cargar();
    this.usuarioService.getVendedores().subscribe({
      next: vendedores => this.vendedores.set(vendedores),
      error: () => this.error.set(MSG.errorVendedores),
    });
  }

  protected etiquetaDeAccion(accion: AccionUsuario): string {
    return ETIQUETA_ACCION_USUARIO[accion];
  }

  protected cambiarVista(vista: 'transacciones' | 'usuarios'): void {
    this.vista.set(vista);
    this.error.set('');
    if (vista === 'usuarios') this.cargarUsuarios();
  }

  protected cambiarPaginaUsuarios(evento: PageEvent): void {
    this.pageIndexUsuarios = evento.pageIndex;
    this.cargarUsuarios();
  }

  private cargarUsuarios(): void {
    this.cargandoUsuarios.set(true);
    this.auditoriaService.listarUsuarios(this.pageIndexUsuarios, this.pageSize).subscribe({
      next: pagina => {
        this.auditoriasUsuarios.set(pagina);
        this.cargandoUsuarios.set(false);
      },
      error: () => {
        this.error.set(MSG.errorCargaUsuarios);
        this.cargandoUsuarios.set(false);
      },
    });
  }

  protected buscar(): void {
    const { transaccionId, vendedorId, fechaDesde, fechaHasta, precioFinalAnterior, precioFinalNuevo } = this.filtros;

    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      this.error.set(MSG.rangoInvalido);
      return;
    }

    const idInvalido = [transaccionId, vendedorId].some(id => id !== null && id <= 0);
    const precioInvalido = [precioFinalAnterior, precioFinalNuevo].some(precio => precio !== null && precio < 0);
    if (idInvalido || precioInvalido) {
      this.error.set(MSG.valoresInvalidos);
      return;
    }

    this.pageIndex = 0;
    this.cargar();
  }

  protected limpiar(): void {
    this.filtros = this.filtrosVacios();
    this.pageIndex = 0;
    this.cargar();
  }

  protected cambiarPagina(evento: PageEvent): void {
    this.pageIndex = evento.pageIndex;
    this.cargar();
  }

  protected nombreVendedor(vendedorId: number | null): string {
    if (vendedorId === null) return SIN_DATO;
    const vendedor = this.vendedores().find(v => v.id === vendedorId);
    return vendedor ? `${vendedor.nombre} ${vendedor.apellido}` : SIN_DATO;
  }

  protected cambio(anterior: string, nuevo: string): string {
    return anterior === nuevo ? SIN_CAMBIO : `${anterior} >> ${nuevo}`;
  }

  protected estadoDe(estado: EstadoTransaccion | null): string {
    return estado ? ETIQUETA_ESTADO[estado] : SIN_DATO;
  }

  protected metodoPagoDe(metodoPago: MetodoPago | null): string {
    return metodoPago ? ETIQUETA_METODO_PAGO[metodoPago] : SIN_DATO;
  }

  protected precioDe(precio: number | null): string {
    return precio !== null ? `$ ${FORMATO_PRECIO.format(precio)}` : SIN_DATO;
  }

  private cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.auditoriaService.listar(this.pageIndex, this.pageSize, this.filtrosParaApi()).subscribe({
      next: pagina => {
        this.auditorias.set(pagina);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(MSG.errorCarga);
        this.cargando.set(false);
      },
    });
  }

  private filtrosParaApi(): FiltrosAuditoria {
    const f = this.filtros;
    return {
      transaccionId: f.transaccionId ?? undefined,
      vendedorId: f.vendedorId ?? undefined,
      fechaDesde: f.fechaDesde ? formatDate(f.fechaDesde, FORMATO_FECHA_API, 'en-US') : undefined,
      fechaHasta: f.fechaHasta ? formatDate(f.fechaHasta, FORMATO_FECHA_API, 'en-US') : undefined,
      precioFinalAnterior: f.precioFinalAnterior ?? undefined,
      precioFinalNuevo: f.precioFinalNuevo ?? undefined,
      metodoPagoAnterior: f.metodoPagoAnterior ?? undefined,
      metodoPagoNuevo: f.metodoPagoNuevo ?? undefined,
      estadoAnterior: f.estadoAnterior ?? undefined,
      estadoNuevo: f.estadoNuevo ?? undefined,
    };
  }

  private filtrosVacios(): FormularioFiltros {
    return {
      transaccionId: null,
      vendedorId: null,
      fechaDesde: null,
      fechaHasta: null,
      precioFinalAnterior: null,
      precioFinalNuevo: null,
      metodoPagoAnterior: null,
      metodoPagoNuevo: null,
      estadoAnterior: null,
      estadoNuevo: null,
    };
  }
}
