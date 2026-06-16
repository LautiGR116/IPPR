export type IpprFieldSeed = {
  key: string;
  label: string;
  icon: string;
  items: string[];
};

export const IPPR_TEST = {
  slug: "ippr",
  name: "Intereses y Preferencias Profesionales",
  version: "vercel-reference-2026-06",
  description:
    "Prototipo IPPR para clasificar intereses profesionales por campos de actividad."
};

export const RESPONSE_OPTIONS = [
  {
    category: "INTERESTED",
    label: "Me interesa",
    shortLabel: "Interesa",
    numericValue: 2,
    tone: "positive"
  },
  {
    category: "UNSURE",
    label: "Tengo dudas",
    shortLabel: "Dudas",
    numericValue: 1,
    tone: "neutral"
  },
  {
    category: "NOT_INTERESTED",
    label: "No me interesa",
    shortLabel: "No",
    numericValue: 0,
    tone: "negative"
  },
  {
    category: "UNKNOWN",
    label: "No conozco",
    shortLabel: "No conozco",
    numericValue: 0,
    tone: "muted"
  }
] as const;

export type ResponseCategory = (typeof RESPONSE_OPTIONS)[number]["category"];

export const TOP_PREFERENCES_REQUIRED = 3;

export const IPPR_FIELDS: IpprFieldSeed[] = [
  {
    key: "cienciasNaturales",
    label: "Ciencias Naturales",
    icon: "🔬",
    items: [
      "Observar fenómenos naturales y buscar explicaciones científicas",
      "Realizar experimentos de química o física en laboratorio",
      "Estudiar el comportamiento de plantas y animales en su hábitat",
      "Clasificar minerales, rocas o fósiles",
      "Analizar muestras biológicas bajo el microscopio",
      "Investigar sobre el cambio climático y el medio ambiente",
      "Estudiar la composición química de sustancias cotidianas",
      "Explorar el universo y los cuerpos celestes",
      "Registrar datos científicos y analizar resultados",
      "Diseñar experimentos para probar hipótesis",
      "Estudiar la genética y los organismos vivos",
      "Investigar sobre energías renovables y sustentabilidad"
    ]
  },
  {
    key: "construccionIngenieria",
    label: "Construcción / Ingeniería",
    icon: "🏗️",
    items: [
      "Diseñar planos y estructuras de edificios o puentes",
      "Calcular la resistencia de materiales de construcción",
      "Supervisar obras de construcción",
      "Programar máquinas industriales o robots",
      "Resolver problemas técnicos en equipos mecánicos",
      "Diseñar sistemas eléctricos para viviendas o fábricas",
      "Planificar proyectos de infraestructura vial",
      "Trabajar con herramientas y equipos de construcción",
      "Analizar fallas estructurales en edificaciones",
      "Diseñar sistemas de agua potable o cloacas",
      "Estudiar termodinámica y mecánica de fluidos",
      "Gestionar proyectos de ingeniería civil o mecánica"
    ]
  },
  {
    key: "salud",
    label: "Salud",
    icon: "🏥",
    items: [
      "Atender a personas enfermas y ayudar en su recuperación",
      "Administrar medicamentos y tratamientos",
      "Realizar diagnósticos médicos usando equipos especializados",
      "Estudiar el funcionamiento del cuerpo humano",
      "Hacer análisis clínicos de sangre, orina u otras muestras",
      "Brindar primeros auxilios en situaciones de emergencia",
      "Orientar a pacientes sobre hábitos saludables",
      "Participar en cirugías o procedimientos médicos",
      "Investigar nuevas enfermedades o tratamientos",
      "Trabajar en farmacia, preparando y dispensando medicamentos",
      "Rehabilitar a personas con lesiones o discapacidades físicas",
      "Cuidar la salud bucal diagnosticando y tratando enfermedades dentales"
    ]
  },
  {
    key: "humanidades",
    label: "Humanidades",
    icon: "📜",
    items: [
      "Estudiar la historia de civilizaciones antiguas y modernas",
      "Analizar textos literarios, filosóficos o religiosos",
      "Investigar sobre culturas y sociedades diferentes",
      "Aprender idiomas y estudiar su evolución histórica",
      "Reflexionar sobre preguntas filosóficas y éticas",
      "Estudiar la evolución del pensamiento humano a lo largo del tiempo",
      "Analizar movimientos sociales y políticos históricos",
      "Investigar el origen y significado de palabras y expresiones",
      "Estudiar la arqueología y el patrimonio cultural",
      "Comparar distintas corrientes filosóficas y religiosas",
      "Analizar textos en idiomas antiguos o extranjeros",
      "Investigar sobre derechos humanos e historia política"
    ]
  },
  {
    key: "derecho",
    label: "Derecho",
    icon: "⚖️",
    items: [
      "Defender los derechos de personas en situaciones de injusticia",
      "Redactar documentos legales como contratos o escrituras",
      "Estudiar leyes y normativas vigentes",
      "Argumentar y debatir en juicios o audiencias",
      "Asesorar a personas sobre sus derechos y obligaciones",
      "Analizar casos judiciales complejos",
      "Investigar delitos y participar en procesos penales",
      "Mediar en conflictos entre personas o instituciones",
      "Estudiar derecho internacional y relaciones entre países",
      "Trabajar en organismos del Estado aplicando leyes",
      "Investigar sobre políticas públicas y legislación",
      "Estudiar la ética y la justicia social"
    ]
  },
  {
    key: "comunicacion",
    label: "Comunicación",
    icon: "📡",
    items: [
      "Redactar noticias, artículos o reportajes periodísticos",
      "Conducir programas de radio o televisión",
      "Crear contenido para redes sociales y medios digitales",
      "Fotografiar y editar imágenes para publicaciones",
      "Diseñar estrategias de comunicación para organizaciones",
      "Entrevistar a personas para conocer sus historias",
      "Producir y editar videos documentales o periodísticos",
      "Escribir guiones para programas, publicidades o películas",
      "Gestionar la imagen pública de personas o empresas",
      "Traducir textos o interpretar en distintos idiomas",
      "Analizar el impacto de los medios en la sociedad",
      "Diseñar campañas publicitarias y de marketing"
    ]
  },
  {
    key: "educacionPsicologia",
    label: "Educación / Psicología",
    icon: "🧠",
    items: [
      "Enseñar a niños, jóvenes o adultos en distintas materias",
      "Acompañar a personas en procesos de desarrollo personal",
      "Diseñar materiales y estrategias de aprendizaje",
      "Orientar a estudiantes con dificultades de aprendizaje",
      "Estudiar el comportamiento humano y sus motivaciones",
      "Aplicar evaluaciones psicológicas y analizar resultados",
      "Trabajar con grupos en dinámicas y talleres educativos",
      "Brindar apoyo emocional a personas en situaciones difíciles",
      "Investigar sobre procesos cognitivos y memoria",
      "Trabajar en equipos interdisciplinarios de salud mental",
      "Coordinar programas educativos en escuelas u organizaciones",
      "Estudiar el desarrollo infantil y la conducta humana"
    ]
  },
  {
    key: "administracionEconomia",
    label: "Administración / Economía",
    icon: "📊",
    items: [
      "Planificar y organizar recursos de una empresa",
      "Analizar datos económicos y hacer proyecciones financieras",
      "Llevar la contabilidad de una organización",
      "Diseñar estrategias para mejorar la rentabilidad de un negocio",
      "Gestionar equipos de trabajo y recursos humanos",
      "Estudiar el comportamiento de mercados y consumidores",
      "Negociar contratos y acuerdos comerciales",
      "Administrar presupuestos y controlar gastos",
      "Analizar inversiones y riesgos financieros",
      "Estudiar el impacto de políticas económicas en la sociedad",
      "Emprender y gestionar proyectos propios",
      "Trabajar en organismos públicos o privados administrando recursos"
    ]
  },
  {
    key: "informatica",
    label: "Informática",
    icon: "💻",
    items: [
      "Programar aplicaciones web o móviles",
      "Diseñar y administrar bases de datos",
      "Resolver problemas técnicos en computadoras y redes",
      "Crear videojuegos o experiencias interactivas digitales",
      "Analizar grandes volúmenes de datos para obtener información útil",
      "Configurar y mantener sistemas de seguridad informática",
      "Diseñar interfaces de usuario atractivas y funcionales",
      "Desarrollar algoritmos para resolver problemas complejos",
      "Administrar servidores y redes de computadoras",
      "Implementar inteligencia artificial y machine learning",
      "Automatizar procesos empresariales con software",
      "Investigar sobre nuevas tecnologías y tendencias digitales"
    ]
  },
  {
    key: "agroVeterinaria",
    label: "Agro / Veterinaria",
    icon: "🌱",
    items: [
      "Cuidar y tratar la salud de animales domésticos y silvestres",
      "Planificar y gestionar cultivos agrícolas",
      "Estudiar enfermedades animales y su prevención",
      "Trabajar en el campo con maquinaria agrícola",
      "Investigar sobre biotecnología aplicada a la agricultura",
      "Gestionar la crianza de animales para producción",
      "Analizar suelos y condiciones climáticas para los cultivos",
      "Diseñar sistemas de irrigación y manejo del agua",
      "Trabajar en conservación de especies en peligro",
      "Estudiar la alimentación y nutrición animal",
      "Asesorar a productores agropecuarios",
      "Investigar sobre agroecología y producción sustentable"
    ]
  },
  {
    key: "artesPlasticasDiseño",
    label: "Artes Plásticas / Diseño",
    icon: "🎨",
    items: [
      "Pintar, dibujar o esculpir obras de arte",
      "Diseñar logos, afiches e identidades visuales",
      "Fotografiar y editar imágenes con fines artísticos",
      "Crear ilustraciones para libros, revistas o medios digitales",
      "Diseñar espacios interiores de viviendas o comercios",
      "Elaborar proyectos de moda y diseño de indumentaria",
      "Crear animaciones o efectos visuales para cine y televisión",
      "Diseñar objetos industriales, muebles o productos",
      "Trabajar con técnicas artesanales como cerámica o textiles",
      "Estudiar la historia del arte y los movimientos artísticos",
      "Diseñar interfaces visuales para aplicaciones y sitios web",
      "Crear murales o intervenciones artísticas en espacios públicos"
    ]
  },
  {
    key: "musicaArtesEscenicas",
    label: "Música / Artes Escénicas",
    icon: "🎭",
    items: [
      "Tocar un instrumento musical en grupos o de manera solista",
      "Cantar o componer canciones propias",
      "Actuar en obras de teatro, cine o televisión",
      "Bailar en espectáculos o compañías de danza",
      "Dirigir o producir espectáculos musicales o teatrales",
      "Estudiar teoría musical y composición",
      "Trabajar en la producción técnica de sonido e iluminación",
      "Escribir guiones o libretos para obras de teatro",
      "Enseñar música, teatro o danza a otras personas",
      "Realizar obras de improvisación o stand-up",
      "Gestionar eventos culturales y artísticos",
      "Estudiar la historia de la música y las artes escénicas"
    ]
  }
];
