import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { ROL } from "../models/Usuario";

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const permitidos = (route.data['roles'] ?? []) as ROL [];
  const rol = auth.rol();

  return (rol !== null && permitidos.includes(rol)) || router.createUrlTree(['/catalogo']);
}