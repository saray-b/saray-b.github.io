/* Datos del sitio. Edita SOLO este archivo para cambiar tu nombre, tus textos
   y tus enlaces. Todo lo que empiece por "[" se muestra resaltado en amarillo
   en la página para que no se te escape.
   Sintaxis en los textos:  **negrita**   *cursiva con acento*   [pendiente]  */
window.SITE = {
  name: "Saray Paola Berrio Beltrán",
  shortName: "Saray Berrio",
  headline: "Ingeniera de Sistemas que *diseña* y *construye* interfaces.",
  lede:
    "Diseño productos digitales en Figma y los llevo a código con React y Next.js. Me interesa entender el problema de punta a punta: desde los datos y la lógica que lo sostienen hasta la interfaz que usa la persona final.",
  about: [
    "Soy de Cartagena, Colombia, y nací en 2003. En mayo de 2026 cerré una etapa importante: me gradué como Ingeniera de Sistemas. Hoy trabajo en el punto donde el código y el diseño se encuentran, que es donde más disfruto.",
    "Lo que más me mueve es aprender. Me gusta planear antes de empezar, diseñar con calma y ver cómo una idea pasa del papel a la pantalla. Me apasiona este trabajo, y cada proyecto nuevo es una buena excusa para probar una herramienta o una forma distinta de resolver las cosas.",
    "Fuera de la pantalla: música en los audífonos casi todo el día, videojuegos y un amor incondicional por los animales (si hay un gato cerca, ya perdí la concentración). Y los zombis: me encantan, tanto que ya me creo experta en supervivencia.",
  ],
  // Mi ciudad, para el globo de "Sobre mí" (coordenadas de Cartagena de Indias)
  home: { name: "Cartagena, Colombia", short: "Cartagena", lat: 10.391, lon: -75.4794 },
  skillsIntro:
    "Estas son las herramientas que manejo hoy. Aun así, siempre estoy buscando otras nuevas y mejores: cada proyecto y cada caso pide la suya, y probar es parte de lo que más disfruto.",
  // [nombre visible, icono]: el icono es un archivo de assets/icons/<icono>.svg
  skills: {
    Diseño: [
      ["Figma", "figma"],
      ["Prototipado", "mouse-pointer-click"],
      ["Wireframing", "layout-template"],
      ["Design Thinking", "lightbulb"],
      ["Sistemas de diseño", "blocks"],
      ["Diseño responsivo", "smartphone"],
    ],
    Desarrollo: [
      ["React", "react"],
      ["Next.js", "nextdotjs"],
      ["HTML", "html5"],
      ["CSS", "css3"],
      ["JavaScript", "javascript"],
      ["Python", "python"],
      ["APIs REST", "webhook"],
    ],
  },
  contact: {
    email: "sarayberrio08@gmail.com",
    links: [
      { label: "LinkedIn", icon: "linkedin", href: "https://www.linkedin.com/in/saray-berr%C3%ADo-166941287/" },
    ],
  },
  // Estadísticas de visitas anónimas y sin cookies (Plausible). Déjalo vacío para no usar ninguna.
  // Para activarlas: crea el sitio en plausible.io y escribe aquí tu dominio, por ejemplo analytics: { domain: "tudominio.com" }.
  analytics: { domain: "" },
  showSoonCard: false, // pon true para mostrar una tarjeta punteada "Próximo proyecto"
  year: new Date().getFullYear(),

  /* Primera vista: "collage" (portada tipo periódico, la actual) o "texto" (solo titular grande, versión simple).
     Para probar la otra sin tocar nada, añade ?hero=texto a la dirección. */
  hero: "collage",

};
