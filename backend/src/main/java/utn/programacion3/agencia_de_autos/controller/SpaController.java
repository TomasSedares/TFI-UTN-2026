package utn.programacion3.agencia_de_autos.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Reenvía las rutas del frontend Angular a index.html para que, al recargar
 * la página o entrar por un link directo, el router de Angular las resuelva.
 */
@Controller
public class SpaController {

    @GetMapping({
            "/catalogo", "/login", "/registro", "/perfil", "/tramites",
            "/menu", "/menu/**", "/vehiculo/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
