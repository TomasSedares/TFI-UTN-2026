import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private intervalId?: ReturnType<typeof setInterval>;

  readonly segundos = signal(5);

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      const restante = this.segundos() - 1;
      this.segundos.set(restante);
      if (restante <= 0) {
        this.router.navigate(['/catalogo']);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }
}
