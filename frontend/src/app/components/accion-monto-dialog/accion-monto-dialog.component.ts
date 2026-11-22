import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ETIQUETA_METODO_PAGO, MetodoPago, PagoRequest, Transaccion } from '../../models/Transacciones';

export interface AccionMontoDialogData {
  tipo: 'senia' | 'venta';
  transaccion: Transaccion;
}

interface FilaDePago {
  metodoPago: MetodoPago;
  monto: number | null;
}

const MSG = {
  montoInvalido: 'Cada pago tiene que tener un monto mayor a cero.',
};

const formatoPesos = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

@Component({
  selector: 'app-accion-monto-dialog',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButton],
  templateUrl: './accion-monto-dialog.component.html',
  styles: `.fila-pago { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }`,
})
export class AccionMontoDialogComponent {
  protected readonly data = inject<AccionMontoDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<AccionMontoDialogComponent, PagoRequest[]>>(MatDialogRef);

  protected readonly esSenia = this.data.tipo === 'senia';
  protected readonly metodosPago = Object.values(MetodoPago);
  protected readonly etiquetaMetodoPago = ETIQUETA_METODO_PAGO;
  protected readonly precioVehiculo = this.data.transaccion.precio_vehiculo;
  protected readonly yaPagado = this.data.transaccion.total_pagado ?? 0;
  protected readonly faltaAbonar = this.precioVehiculo - this.yaPagado;

  protected readonly error = signal('');

  // En la venta se sugiere pagar todo lo que falta; en la seña arranca vacío
  protected readonly filas = signal<FilaDePago[]>([
    { metodoPago: MetodoPago.EFECTIVO, monto: this.esSenia ? null : this.faltaAbonar },
  ]);

  protected readonly totalIngresado = computed(() =>
    this.filas().reduce((total, fila) => total + (fila.monto ?? 0), 0),
  );

  protected readonly diferencia = computed(() => this.faltaAbonar - this.totalIngresado());

  protected readonly resumen = computed(() => {
    const diferencia = this.diferencia();
    if (diferencia < 0) return `Te pasás por $ ${formatoPesos.format(-diferencia)} del precio del vehículo.`;
    if (diferencia === 0) return 'Cubre exactamente el precio del vehículo.';
    return this.esSenia
      ? `Quedarían $ ${formatoPesos.format(diferencia)} por abonar.`
      : `Faltan $ ${formatoPesos.format(diferencia)} para concretar la venta.`;
  });

  protected readonly puedeConfirmar = computed(() => {
    const total = this.totalIngresado();
    if (total <= 0) return false;
    return this.esSenia ? total <= this.faltaAbonar : total === this.faltaAbonar;
  });

  protected formatear(monto: number): string {
    return formatoPesos.format(monto);
  }

  protected agregarFila(): void {
    this.filas.update(filas => [...filas, { metodoPago: MetodoPago.TRANSFERENCIA, monto: null }]);
  }

  protected quitarFila(indice: number): void {
    this.filas.update(filas => filas.filter((_, posicion) => posicion !== indice));
  }

  protected cambiarMetodo(indice: number, metodoPago: MetodoPago): void {
    this.filas.update(filas => filas.map((fila, posicion) => (posicion === indice ? { ...fila, metodoPago } : fila)));
  }

  protected cambiarMonto(indice: number, monto: number | null): void {
    this.filas.update(filas => filas.map((fila, posicion) => (posicion === indice ? { ...fila, monto } : fila)));
  }

  protected confirmar(): void {
    const filas = this.filas();
    if (!filas.length || filas.some(fila => !fila.monto || fila.monto <= 0)) {
      this.error.set(MSG.montoInvalido);
      return;
    }
    if (!this.puedeConfirmar()) {
      this.error.set(this.resumen());
      return;
    }
    this.dialogRef.close(filas.map(fila => ({ metodoPago: fila.metodoPago, monto: fila.monto as number })));
  }

  protected cerrar(): void {
    this.dialogRef.close();
  }
}
