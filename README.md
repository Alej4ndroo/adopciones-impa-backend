# Adopciones
Desarrollo de sistema de gestión de adopciones para la IMPA 

Permisos:
Admin:
•	Todo poderoso.
•	Puede hacer un CRUD de adoptables.
•	CRUD de veterinarios.

Director: 
•	Puede hacer un CRUD de adoptables.
•	CRUD de veterinarios.

Persona:
•	Puede adoptar una mascota.
•	Dar seguimiento de adopción.
•	Ver catálogo de adoptables. 
•	Agendar una cita con el veterinario.

Atributos: 
Mascota {
-	ID
-	Nombre
-	Especie
-	Raza
-	Edad_en_meses
-	Color
-	Tamaño
-	Sexo 
}

Usuario Admin/Director {
-	Id
-	Nombre
-	Correo-electrónico
-	Número de empleado
-	Fecha de nacimiento
-	Cargo
}

Persona {
-	Id
-	Nombre
-	Correo electrónico
-	Fecha de nacimiento
-	Calle
-	Colonia
-	CP
-	Ciudad
-	Teléfono 
}

Demás detalles: 
	Es una página web.
	En caso de que no se haya podido concretar la adopción, se devuelve el adoptable en el catálogo y se especifica el por qué la persona no pudo adoptar.
	Instituto Moreliano de Protección Animal.
	Proceso: La persona ve el adoptable que quiere, agenda una cita o va directamente al IMPA, se solicita su documentación (como INE), se ve que el adoptable esté bien y finalmente se hace la entrega. 
	Se debe de verificar la documentación de cada persona.
	Una persona puede adoptar más de una mascota. 
	En caso de que una persona ya haya adoptado, se debe de guardar la información y documentación previamente ingresada.  
	Se pueden añadir atributos a los diferentes usuarios del sistema. 
	No se hacen cargos por citas, solo para visitas con un veterinario cuando hay que dar medicinas o algún tratamiento. 

Historia de usuario:
-	Como persona registrada en el sistema yo quiero adoptar una mascota que se encuentre en el catálogo. (Esta hay que descomponerla en historia de usuarios más pequeña)


