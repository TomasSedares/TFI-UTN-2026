import { Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Observable } from 'rxjs';
import {
  ConfirmarDialogComponent,
  ConfirmarDialogData,
} from '../../../components/confirmar-dialog/confirmar-dialog.component';
import { ImagenDialogComponent, ImagenDialogData } from '../../../components/imagen-dialog/imagen-dialog.component';
import { Imagen, ImagenRequest } from '../../../models/Imagen';
import { VehiculoGestion } from '../../../models/Vehiculo';
import { ImagenService } from '../../../services/imagen.service';
import { VehiculoService } from '../../../services/vehiculo-service.service';

const DURACION_MENSAJE_MS = 3500;

const TAMANIO_DIALOGO = { width: '480px', maxWidth: '92vw' };

const CANTIDAD_MAXIMA_VEHICULOS = 1000;

const MSG = {
  errorCarga: 'No se pudieron cargar las imágenes.',
  errorCargaVehiculos: 'No se pudieron cargar los vehículos.',
  errorOperacion: 'No se pudo completar la operación. Revisá los datos e intentá nuevamente.',
  errorEliminar: 'No se pudo eliminar la imagen.',
  creada: 'Imagen cargada.',
  actualizada: 'Imagen actualizada.',
  eliminada: 'Imagen eliminada.',
};

@Component({
  imports: [MatTableModule, MatFormFieldModule, MatSelectModule, MatButton],
  selector: 'app-imagenes',
  styleUrl: './imagenes.component.scss',
  templateUrl: './imagenes.component.html',
})
export class ImagenesComponent {
  private readonly imagenService = inject(ImagenService);
  private readonly vehiculoService = inject(VehiculoService);
  private readonly dialog = inject(MatDialog);

  protected readonly columnas = ['imagen', 'principal', 'acciones'];

  readonly imagenes = signal<Imagen[]>([]);
  readonly vehiculos = signal<VehiculoGestion[]>([]);
  readonly vehiculoId = signal<number | null>(null);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');

  constructor() {
    this.vehiculoService.listarGestion(0, CANTIDAD_MAXIMA_VEHICULOS).subscribe({
      next: pagina => this.vehiculos.set(pagina.content),
      error: () => this.error.set(MSG.errorCargaVehiculos),
    });
  }

  seleccionarVehiculo(vehiculoId: number): void {
    this.vehiculoId.set(vehiculoId);
    this.error.set('');
    this.cargar();
  }

  cargar(): void {
    const vehiculoId = this.vehiculoId();
    if (!vehiculoId) return;

    this.cargando.set(true);
    this.imagenService.listarPorVehiculo(vehiculoId).subscribe({
      next: imagenes => {
        this.imagenes.set(imagenes);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(MSG.errorCarga);
        this.cargando.set(false);
      },
    });
  }

  abrirCrear(): void {
    const vehiculoId = this.vehiculoId();
    if (!vehiculoId) return;

    this.error.set('');
    this.dialog
      .open<ImagenDialogComponent, ImagenDialogData, ImagenRequest>(ImagenDialogComponent, {
        ...TAMANIO_DIALOGO,
        data: { imagen: null, vehiculoId },
      })
      .afterClosed()
      .subscribe(datos => {
        if (!datos) return;
        this.ejecutar(this.imagenService.crear(datos), MSG.creada);
      });
  }

  abrirEditar(imagen: Imagen): void {
    const vehiculoId = this.vehiculoId();
    if (!vehiculoId) return;

    this.error.set('');
    this.dialog
      .open<ImagenDialogComponent, ImagenDialogData, ImagenRequest>(ImagenDialogComponent, {
        ...TAMANIO_DIALOGO,
        data: { imagen, vehiculoId },
      })
      .afterClosed()
      .subscribe(datos => {
        if (!datos) return;
        this.ejecutar(this.imagenService.actualizar(imagen.id, datos), MSG.actualizada);
      });
  }

  abrirBorrar(imagen: Imagen): void {
    this.error.set('');
    this.dialog
      .open<ConfirmarDialogComponent, ConfirmarDialogData, boolean>(ConfirmarDialogComponent, {
        ...TAMANIO_DIALOGO,
        data: {
          titulo: 'Eliminar imagen',
          mensaje: `¿Seguro que querés eliminar la imagen #${imagen.id} del vehículo ${imagen.patenteVehiculo}? Esta acción no se puede deshacer.`,
          accion: 'Eliminar',
        },
      })
      .afterClosed()
      .subscribe(confirmado => {
        if (!confirmado) return;
        this.ejecutar(this.imagenService.eliminar(imagen.id), MSG.eliminada, MSG.errorEliminar);
      });
  }

  private ejecutar(solicitud: Observable<unknown>, exito: string, fallo = MSG.errorOperacion): void {
    solicitud.subscribe({
      next: () => {
        this.mostrarMensaje(exito);
        this.cargar();
      },
      error: () => this.error.set(fallo),
    });
  }

  private mostrarMensaje(texto: string): void {
    this.mensaje.set(texto);
    setTimeout(() => this.mensaje.set(''), DURACION_MENSAJE_MS);
  }
}
