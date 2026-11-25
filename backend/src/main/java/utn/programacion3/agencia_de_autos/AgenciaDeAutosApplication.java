package utn.programacion3.agencia_de_autos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class AgenciaDeAutosApplication {

	public static void main(String[] args) {
		SpringApplication.run(AgenciaDeAutosApplication.class, args);
	}

}
