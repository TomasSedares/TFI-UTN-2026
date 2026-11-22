package utn.programacion3.agencia_de_autos.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import utn.programacion3.agencia_de_autos.model.PagoTransaccion;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PagoTransaccionRepository extends JpaRepository<PagoTransaccion, Long> {

    List<PagoTransaccion> findByTransaccionIdOrderByIdAsc(Long transaccionId);

    @Query("SELECT COALESCE(SUM(p.monto), 0) FROM PagoTransaccion p WHERE p.transaccion.id = :transaccionId")
    BigDecimal sumarMontosPorTransaccion(@Param("transaccionId") Long transaccionId);
}
