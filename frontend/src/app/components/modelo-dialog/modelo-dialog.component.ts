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
  camposObligatorios: 'Completá marca, nombre, año y tipo.',
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
  protected readonly anios = this.armarAnios();
  protected readonly tiposModelo = Object.values(TipoModelo);
  protected readonly etiquetaTipoModelo = ETIQUETA_TIPO_MODELO;
  protected readonly error = signal('');
  protected marcaId: number | null = this.data.modelo?.marcaId ?? null;
  protected nombre = this.data.modelo?.nombre ?? '';
  protected anio: number | null = this.data.modelo?.anio ?? null;
  protected tipoModelo: TipoModelo | null = this.data.modelo?.tipoModelo ?? null;
  protected activo = this.data.modelo?.activo ?? true;

  private armarAnios(): number[] {
    const anios: number[] = [];
    for (let anio = ANIO_MAXIMO; anio >= ANIO_MINIMO; anio--) anios.push(anio);
    const anioActual = this.data.modelo?.anio;
    if (anioActual && !anios.includes(anioActual)) anios.push(anioActual);
    return anios.sort((anioA, anioB) => anioB - anioA);
  }

  protected confirmar(): void {

    const nombre = this.nombre.trim();

    if (!this.marcaId || !nombre || !this.anio || !this.tipoModelo) {
      this.error.set(MSG.camposObligatorios);
      return;
    }

    this.dialogRef.close({
      nombre,
      anio: this.anio,
      tipoModelo: this.tipoModelo,
      marcaId: this.marcaId,
      activo: this.activo,
    });
  }

  protected cerrar(): void {
    this.dialogRef.close();
  }
}
