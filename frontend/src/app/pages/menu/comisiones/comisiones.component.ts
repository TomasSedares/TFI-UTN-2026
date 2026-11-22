import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { DashboardCardComponent, DashboardCardData } from '../../../components/dashboard-card/dashboard-card.component';
import { ComisionVendedor } from '../../../models/Transacciones';
import { Usuario } from '../../../models/Usuario';
import { TransaccionService } from '../../../services/transaccion.service';
import { UsuarioService } from '../../../services/usuario.service';

const MSG = {
  errorVendedores: 'No se pudieron cargar los vendedores.',
  camposObligatorios: 'Elegí un vendedor y el rango de fechas.',
  rangoInvalido: 'La fecha desde no puede ser posterior a la fecha hasta.',
  errorCalculo: 'No se pudo calcular la comisión del vendedor.',
};

@Component({
  imports: [
    CurrencyPipe,
    DashboardCardComponent,
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-AR' }, provideNativeDateAdapter()],
  selector: 'app-comisiones',
  styleUrl: './comisiones.component.scss',
  templateUrl: './comisiones.component.html',
})
export class ComisionesComponent {
  private readonly usuarioService = inject(UsuarioService);
  private readonly transaccionService = inject(TransaccionService);

  protected readonly hoy = new Date();
  protected readonly vendedores = signal<Usuario[]>([]);
  protected readonly comision = signal<ComisionVendedor | null>(null);
  protected readonly periodo = signal<{ desde: Date; hasta: Date } | null>(null);
  protected readonly columnasVentas = ['fecha', 'vehiculo', 'patente', 'precio', 'comision'];
  protected readonly calculando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly tarjetaComision = computed<DashboardCardData | null>(() => {
    const comision = this.comision();
    if (!comision) return null;
    return {
      titulo: 'Comisión total',
      valor: comision.comision_total,
      descripcion: `${comision.nombre_completo} · ${comision.email}`,
      moneda: true,
    };
  });

  protected vendedorId: number | null = null;
  protected fechaDesde: Date | null = new Date(this.hoy.getFullYear(), this.hoy.getMonth(), 1);
  protected fechaHasta: Date | null = this.hoy;

  constructor() {
    this.usuarioService.getVendedores().subscribe({
      next: vendedores => this.vendedores.set(vendedores),
      error: () => this.error.set(MSG.errorVendedores),
    });
  }

  protected calcular(): void {

    const { vendedorId, fechaDesde, fechaHasta } = this;

    if (!vendedorId || !fechaDesde || !fechaHasta) {
      this.error.set(MSG.camposObligatorios);
      return;
    }
    
    if (fechaDesde > fechaHasta) {
      this.error.set(MSG.rangoInvalido);
      return;
    }

    this.error.set(null);
    this.calculando.set(true);
    this.transaccionService.comisionPorVendedor(vendedorId, fechaDesde, fechaHasta).subscribe({
      next: comision => {
        this.comision.set(comision);
        this.periodo.set({ desde: fechaDesde, hasta: fechaHasta });
        this.calculando.set(false);
      },
      error: () => {
        this.comision.set(null);
        this.error.set(MSG.errorCalculo);
        this.calculando.set(false);
      },
    });
  }
}
