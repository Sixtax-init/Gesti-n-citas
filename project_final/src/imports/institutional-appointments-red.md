Contexto del proyecto: Es un Sistema de Citas institucional universitario en Next.js + Tailwind CSS con 3 roles: Alumno, Especialista y Administrador. Gestiona citas de los departamentos de Psicología, Tutorías y Nutrición. El diseño actual es funcional pero muy neutro (fondo gris claro, cards blancas, botones azules). Necesito que rediseñes y amplíes las siguientes pantallas manteniendo el stack tecnológico actual: Next.js + React + Tailwind CSS. Todos los componentes deben generarse como React functional components con hooks, usando clases de Tailwind para los estilos. No usar CSS externo ni styled-components.



CAMBIOS Y NUEVAS FUNCIONALIDADES A DISEÑAR:

1. Registro y Login





En el formulario de registro, eliminar la opción de seleccionar rol "Especialista". Solo debe existir "Alumno". Agregar campo de género (Masculino / Femenino) para fines de reportes.

2. Panel del Administrador





Eliminar los botones de "Confirmar" y "Cancelar" citas. El admin solo visualiza.



Mejorar las estadísticas: agregar gráficas por departamento (barras o dona) que muestren: citas por mes, motivos más frecuentes, modalidad (presencial vs virtual), distribución por carrera y semestre.



Nueva pestaña "Especialistas": formulario para agregar nuevos especialistas con nombre, departamento, correo, contraseña temporal y horarios iniciales.



Nueva pestaña "Reportes": 4 botones para generar reportes en PDF: Psicología, Tutorías, Nutrición y Reporte Global. Cada reporte incluye: motivos de consulta, género (hombres/mujeres), carreras, semestres, edad promedio, canalizaciones (maestro/tutor/auto), modalidad.



Nueva pestaña "Publicar Evento": formulario para crear un banner de evento/taller con título, descripción, departamento, fecha, imagen opcional. Se muestra como banner en el dashboard del alumno.

3. Panel del Especialista





Nueva sección "Mis Horarios": vista semanal donde el especialista puede agregar, editar o eliminar sus horarios disponibles por día y hora.



Nueva sección "Publicar Contenido": formulario para subir material (video embed, imagen, link externo) etiquetado por departamento. Con título y descripción.



Nueva sección "Publicar Evento": igual que la del admin pero limitada a su departamento.

4. Dashboard del Alumno





Agregar sección de Banners de Eventos en la parte superior del dashboard: carrusel o cards destacadas con los próximos talleres/eventos de los 3 departamentos. Con botón "Registrarme al taller".



Agregar sección "Recursos y Contenido" con pestañas por departamento (Psicología / Tutorías / Nutrición) donde se muestren videos, imágenes y links subidos por los especialistas.



En la lista de citas próximas, agregar botón "Reagendar" en cada cita con estado Pendiente o Confirmada. Abre un modal similar al flujo de solicitar cita (paso 2: seleccionar nueva fecha/hora).



Si una cita tiene modalidad Virtual, mostrar un aviso destacado: "Esta sesión es virtual. Recibirás el enlace e información por correo institucional previo a la cita."



Agregar sección "Actividades y Talleres" donde el alumno puede ver y agendar talleres programados, similar al flujo de citas pero simplificado (seleccionar actividad → seleccionar fecha → confirmar).

5. Notificaciones





Agregar ícono de campana en el header con badge de contador.



Panel de notificaciones con alertas de: cita confirmada, cita próxima (24hrs antes), nuevo evento/taller publicado por su departamento, reagendamiento exitoso.

GUÍA DE ESTILO A MANTENER:





Colores por departamento: Psicología = Azul (#2563EB), Tutorías = Verde (#16A34A), Nutrición = Naranja (#EA580C)



Fondo general: gris muy claro (#F1F5F9)



Cards: blancas con sombra suave



Tipografía limpia, sans-serif



Botones primarios: azul institucional



El diseño debe verse profesional, moderno y apto para uso universitario

