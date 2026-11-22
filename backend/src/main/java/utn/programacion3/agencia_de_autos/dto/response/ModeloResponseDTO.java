package utn.programacion3.agencia_de_autos.dto.response;

import java.util.Set;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import utn.programacion3.agencia_de_autos.model.enums.TipoModelo;

@Getter
@Setter
@Builder
public class ModeloResponseDTO {

    private Long id;

    private String nombre;

    private String marca;

    private Long marcaId;

    private Set<Integer> anios;

    private TipoModelo tipoModelo;

    private Boolean activo;
}