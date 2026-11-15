package utn.programacion3.agencia_de_autos.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CambiarEstadoRequestDTO {
    @NotNull
    private Boolean activo;
}
