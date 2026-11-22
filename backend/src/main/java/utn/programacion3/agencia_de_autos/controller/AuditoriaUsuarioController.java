package utn.programacion3.agencia_de_autos.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import utn.programacion3.agencia_de_autos.dto.response.AuditoriaUsuarioResponseDTO;
import utn.programacion3.agencia_de_autos.service.AuditoriaUsuarioService;

@RestController
@RequestMapping("/auditoria/usuarios")
@RequiredArgsConstructor
@Tag(
        name = "Auditoria Usuario",
        description = "Historial de altas, bajas, reactivaciones y cambios de rol de usuarios"
)
public class AuditoriaUsuarioController {

    private final AuditoriaUsuarioService auditoriaUsuarioService;

    @Operation(
            summary = "Listar el historial de usuarios",
            description = "Devuelve de forma paginada, del más reciente al más antiguo, quién dio de alta, de baja, reactivó o cambió de rol a cada usuario."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Historial obtenido exitosamente"),
            @ApiResponse(responseCode = "403", description = "Acceso denegado. Se requiere rol ADMINISTRADOR")
    })
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @GetMapping
    public ResponseEntity<Page<AuditoriaUsuarioResponseDTO>> listar(
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(auditoriaUsuarioService.listar(pageable));
    }
}
