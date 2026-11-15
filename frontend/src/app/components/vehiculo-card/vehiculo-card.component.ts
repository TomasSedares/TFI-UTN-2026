import { Component, input, output } from '@angular/core';
import { ETIQUETA_COMBUSTIBLE, ETIQUETA_TRANSMISION, Vehiculo } from '../../models/Vehiculo';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

const FORMATO_NUMERO = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

@Component({
  imports: [MatCardModule, MatIconModule],
  selector: 'app-vehiculo-card',
  styleUrl: './vehiculo-card.component.scss',
  templateUrl: './vehiculo-card.component.html',
})
export class VehiculoCardComponent {
  readonly vehiculo = input<Vehiculo>();
  readonly irDetalle = output<number>();

  protected readonly etiquetaCombustible = ETIQUETA_COMBUSTIBLE;
  protected readonly etiquetaTransmision = ETIQUETA_TRANSMISION;

  protected formatearNumero(valor: number): string {
    return FORMATO_NUMERO.format(valor);
  }
}
