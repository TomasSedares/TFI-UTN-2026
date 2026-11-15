import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  imports: [MatSidenavModule, MatListModule, MatIconModule, RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'app-menu',
  styleUrl: './menu.component.scss',
  templateUrl: './menu.component.html',
})
export class MenuComponent {
  protected readonly auth = inject(AuthService);
}
