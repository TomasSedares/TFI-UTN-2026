package utn.programacion3.agencia_de_autos.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import utn.programacion3.agencia_de_autos.model.Modelo;
import utn.programacion3.agencia_de_autos.model.enums.TipoModelo;

@Repository
public interface ModeloRepository extends JpaRepository<Modelo, Long> {

    // Un modelo se identifica por marca + nombre + tipo + año: el mismo modelo puede cargarse en varios años
    boolean existsByMarcaIdAndNombreIgnoreCaseAndTipoModeloAndAnio(Long marcaId, String nombre,
                                                                   TipoModelo tipoModelo, Integer anio);

    boolean existsByMarcaIdAndNombreIgnoreCaseAndTipoModeloAndAnioAndIdNot(Long marcaId, String nombre,
                                                                           TipoModelo tipoModelo, Integer anio, Long id);
}
