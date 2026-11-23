import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ETIQUETA_TIPO_MODELO, Marca, Modelo, ModeloRequest, TipoModelo } from '../../models/Opciones';

export interface ModeloDialogData {
  modelo: Modelo | null;
  marcas: Marca[];
}

const ANIO_MINIMO = 1990;

const ANIO_MAXIMO = new Date().getFullYear() + 1;

const MSG = {
  camposObligatorios: 'Completá marca, nombre, tipo y al menos un año.',
};

@Component({
  selector: 'app-modelo-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButton,
  ],
  templateUrl: './modelo-dialog.component.html',
})
export class ModeloDialogComponent {
  protected readonly data = inject<ModeloDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<ModeloDialogComponent, ModeloRequest>>(MatDialogRef);

  protected readonly esEdicion = this.data.modelo !== null;
  // Desplegable de años: del próximo año modelo hasta 1990 (si el modelo ya tiene un año anterior, se conserva)
  protected readonly aniosDisponibles = this.armarAnios();
  protected readonly tiposModelo = Object.values(TipoModelo);
  protected readonly etiquetaTipoModelo = ETIQUETA_TIPO_MODELO;
  protected readonly error = signal('');
  protected marcaId: number | null = this.data.modelo?.marcaId ?? null;
  protected nombre = this.data.modelo?.nombre ?? '';
  protected aniosSeleccionados: number[] = [...(this.data.modelo?.anios ?? [])];
  protected tipoModelo: TipoModelo | null = this.data.modelo?.tipoModelo ?? null;
  protected activo = this.data.modelo?.activo ?? true;

  private armarAnios(): number[] {
    const anios: number[] = [];
    for (let anio = ANIO_MAXIMO; anio >= ANIO_MINIMO; anio--) anios.push(anio);
    for (const anioGuardado of this.data.modelo?.anios ?? []) {
      if (!anios.includes(anioGuardado)) anios.push(anioGuardado);
    }
    return anios.sort((anioA, anioB) => anioB - anioA);
  }

  protected confirmar(): void {

    const nombre = this.nombre.trim();

    if (!this.marcaId || !nombre || !this.aniosSeleccionados.length || !this.tipoModelo) {
      this.error.set(MSG.camposObligatorios);
      return;
    }

    this.dialogRef.close({
      nombre,
      anios: [...this.aniosSeleccionados].sort((anioA, anioB) => anioA - anioB),
      tipoModelo: this.tipoModelo,
      marcaId: this.marcaId,
      activo: this.activo,
    });
  }

  protected cerrar(): void {
    this.dialogRef.close();
  }
}
