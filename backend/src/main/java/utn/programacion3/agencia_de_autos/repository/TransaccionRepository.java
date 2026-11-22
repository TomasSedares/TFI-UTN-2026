package utn.programacion3.agencia_de_autos.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import utn.programacion3.agencia_de_autos.model.BalanceProyeccion;
import utn.programacion3.agencia_de_autos.model.Transaccion;
import utn.programacion3.agencia_de_autos.model.enums.EstadoTransaccion;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransaccionRepository extends
        JpaRepository<Transaccion,Long>,
        JpaSpecificationExecutor<Transaccion> {

    boolean existsByVehiculoIdAndClienteEmailAndEstadoTransaccionNot(
            Long vehiculoId,
            String clienteEmail,
            EstadoTransaccion estadoTransaccion
    );

    boolean existsByClienteEmailAndEstadoTransaccion(String clienteEmail, EstadoTransaccion estadoTransaccion);

    List<Transaccion> findByClienteEmailOrderByIdDesc(String clienteEmail);

    List<Transaccion> findByVehiculoIdAndEstadoTransaccionAndIdNot(
            Long vehiculoId,
            EstadoTransaccion estadoTransaccion,
            Long id
    );

    @Query("SELECT COUNT(t) FROM Transaccion t WHERE t.vendedor.id = :vendedorId AND t.fecha_asignacion >= :desde")
    long contarAsignacionesDesde(@Param("vendedorId") Long vendedorId, @Param("desde") LocalDateTime desde);

    @Query("SELECT t FROM Transaccion t WHERE t.estadoTransaccion = :estado " +
            "AND t.fecha_asignacion IS NOT NULL AND t.fecha_asignacion < :limite")
    List<Transaccion> buscarAsignadasAnterioresA(@Param("estado") EstadoTransaccion estado,
                                                 @Param("limite") LocalDateTime limite);

    @Query("SELECT t FROM Transaccion t WHERE t.estadoTransaccion = :estado " +
            "AND t.fecha_reserva IS NOT NULL AND t.fecha_reserva < :limite")
    List<Transaccion> buscarReservadasAnterioresA(@Param("estado") EstadoTransaccion estado,
                                                  @Param("limite") LocalDateTime limite);

    @Query("SELECT t FROM Transaccion t WHERE t.vendedor.id = :vendedorId " +
            "AND t.estadoTransaccion = :estado " +
            "AND t.fecha_venta BETWEEN :desde AND :hasta " +
            "ORDER BY t.fecha_venta DESC, t.id DESC")
    List<Transaccion> buscarVentasDeVendedor(@Param("vendedorId") Long vendedorId,
                                             @Param("estado") EstadoTransaccion estado,
                                             @Param("desde") LocalDate desde,
                                             @Param("hasta") LocalDate hasta);

    @Query("SELECT " +
            "SUM(t.precio_final) as precioFinalTotal, " +
            "SUM(t.comision_calculada) as comisionesTotal, " +
            "SUM(t.vehiculo.precioAdquisicion) as costosVehiculos " +
            "FROM Transaccion t " +
            "WHERE t.created_at BETWEEN :desde AND :hasta " +
            "AND t.estadoTransaccion = utn.programacion3.agencia_de_autos.model.enums.EstadoTransaccion.VENDIDO")
    Optional<BalanceProyeccion> calcularBalanceEntreFechas(
            @Param("desde") LocalDate desde,
            @Param("hasta") LocalDate hasta
    );
}
