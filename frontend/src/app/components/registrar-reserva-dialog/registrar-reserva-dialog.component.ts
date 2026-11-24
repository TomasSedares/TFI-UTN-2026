import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ETIQUETA_METODO_PAGO, EstadoTransaccion, MetodoPago, Transaccion } from '../../models/Transacciones';

export type EstadoReserva = EstadoTransaccion.RESERVA | EstadoTransaccion.SENIADO;

export interface DatosReserva {
  metodoPago: MetodoPago;
  estadoTransaccion: EstadoReserva;
  // true cuando el vendedor quiere dejar registrada la seña enseguida de reservar
  senarAhora: boolean;
}

@Component({
  selector: 'app-registrar-reserva-dialog',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButton],
  templateUrl: './registrar-reserva-dialog.component.html',
})
export class RegistrarReservaDialogComponent {
  protected readonly transaccion = inject<Transaccion>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<RegistrarReservaDialogComponent, DatosReserva>>(MatDialogRef);

  protected readonly metodosPago = Object.values(MetodoPago);
  protected readonly etiquetaMetodoPago = ETIQUETA_METODO_PAGO;
  protected readonly precioVehiculo = this.transaccion.precio_vehiculo;
  protected metodoPago: MetodoPago = this.transaccion.metodoPago ?? MetodoPago.EFECTIVO;

  protected confirmar(senarAhora: boolean): void {
    this.dialogRef.close({ metodoPago: this.metodoPago, estadoTransaccion: EstadoTransaccion.RESERVA, senarAhora });
  }

  protected cerrar(): void {
    this.dialogRef.close();
  }
}
