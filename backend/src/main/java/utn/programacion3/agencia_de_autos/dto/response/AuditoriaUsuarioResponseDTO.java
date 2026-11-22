package utn.programacion3.agencia_de_autos.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import utn.programacion3.agencia_de_autos.model.enums.AccionUsuario;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuditoriaUsuarioResponseDTO {

    private Long id;

    private Long usuarioId;

    private String usuarioEmail;

    private String usuarioNombre;

    private AccionUsuario accion;

    private String realizadoPorEmail;

    private LocalDateTime fecha;
}
