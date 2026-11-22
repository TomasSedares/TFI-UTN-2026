package utn.programacion3.agencia_de_autos.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import utn.programacion3.agencia_de_autos.model.Modelo;
import utn.programacion3.agencia_de_autos.model.enums.TipoModelo;

@Repository
public interface ModeloRepository extends JpaRepository<Modelo, Long> {

    // Un modelo se identifica por marca + nombre + tipo; sus años se guardan dentro del mismo modelo
    boolean existsByMarcaIdAndNombreIgnoreCaseAndTipoModelo(Long marcaId, String nombre, TipoModelo tipoModelo);

    boolean existsByMarcaIdAndNombreIgnoreCaseAndTipoModeloAndIdNot(Long marcaId, String nombre,
                                                                    TipoModelo tipoModelo, Long id);
}
