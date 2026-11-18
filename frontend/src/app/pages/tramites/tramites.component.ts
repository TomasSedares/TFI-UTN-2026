import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TransaccionService } from '../../services/transaccion.service';
import {
  ETIQUETA_ESTADO,
  ETIQUETA_METODO_PAGO,
  SIN_OBSERVACIONES,
  type Transaccion,
} from '../../models/Transacciones';

@Component({
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  selector: 'app-tramites',
  styleUrl: './tramites.component.scss',
  templateUrl: './tramites.component.html',
})
export class TramitesComponent {
  private readonly transaccionService = inject(TransaccionService);

  readonly etiquetaEstado = ETIQUETA_ESTADO;
  readonly etiquetaMetodoPago = ETIQUETA_METODO_PAGO;
  readonly sinObservaciones = SIN_OBSERVACIONES;

  readonly tramites = signal<Transaccion[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.transaccionService.misTramites().subscribe({
      next: (tramites) => {
        this.tramites.set(tramites);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar tus trámites. Intentá de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  nombreVendedor(tramite: Transaccion): string{
    return tramite.vendedor_nombre ?`${tramite.vendedor_nombre} ${tramite.vendedor_apellido}` : 'Sin asignar';
  }

  emailVendedor(tramite: Transaccion): string{
    return tramite.vendedor_email ?`${tramite.vendedor_email}` : 'Sin asignar';
  }
}
