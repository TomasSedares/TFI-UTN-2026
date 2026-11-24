import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  EditarTransaccion,
  ETIQUETA_METODO_PAGO,
  EstadoTransaccion,
  MetodoPago,
  Transaccion,
} from '../../models/Transacciones';

const DIAS_MAXIMOS_HASTA_LA_VISITA = 14;

const MSG = {
  fechaIncompleta: 'Elegí el día y la hora de la visita.',
  fechaPasada: 'La visita tiene que ser en una fecha y hora futura.',
  fechaLejana: `La visita no puede agendarse con más de ${DIAS_MAXIMOS_HASTA_LA_VISITA} días de anticipación.`,
};

@Component({
  selector: 'app-editar-transaccion-dialog',
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatButton],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-AR' }, provideNativeDateAdapter()],
  templateUrl: './editar-transaccion-dialog.component.html',
})
export class EditarTransaccionDialogComponent {
  protected readonly transaccion = inject<Transaccion>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<EditarTransaccionDialogComponent, EditarTransaccion>>(MatDialogRef);

  protected readonly esVisita = this.transaccion.estadoTransaccion === EstadoTransaccion.SOLICITAR;
  protected readonly metodosPago = Object.values(MetodoPago);
  protected readonly etiquetaMetodoPago = ETIQUETA_METODO_PAGO;
  protected readonly hoy = new Date();
  protected readonly maximo = new Date(Date.now() + DIAS_MAXIMOS_HASTA_LA_VISITA * 24 * 60 * 60 * 1000);
  protected readonly error = signal('');

  protected dia: Date | null = this.transaccion.fecha_visita ? new Date(this.transaccion.fecha_visita) : null;
  protected hora = this.transaccion.fecha_visita?.slice(11, 16) ?? '';
  protected metodoPago: MetodoPago = this.transaccion.metodoPago ?? MetodoPago.EFECTIVO;
  protected observaciones = this.transaccion.observaciones ?? '';

  protected confirmar(): void {
    const datosEditados: EditarTransaccion = { observaciones: this.observaciones.trim() };

    if (this.esVisita) {
      // La fecha es opcional al editar: si se completa hay que completarla entera y cumplir las reglas
      if (this.dia || this.hora) {
        if (!this.dia || !this.hora) {
          this.error.set(MSG.fechaIncompleta);
          return;
        }
        const [horas, minutos] = this.hora.split(':').map(Number);
        const fechaVisita = new Date(this.dia);
        fechaVisita.setHours(horas, minutos, 0, 0);

        if (fechaVisita <= new Date()) {
          this.error.set(MSG.fechaPasada);
          return;
        }
        if (fechaVisita > this.maximo) {
          this.error.set(MSG.fechaLejana);
          return;
        }
        datosEditados.fechaVisita = this.formatearFechaHora(fechaVisita);
      }
    } else {
      datosEditados.metodoPago = this.metodoPago;
    }

    this.dialogRef.close(datosEditados);
  }

  protected cerrar(): void {
    this.dialogRef.close();
  }

  private formatearFechaHora(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}T${this.hora}`;
  }
}
