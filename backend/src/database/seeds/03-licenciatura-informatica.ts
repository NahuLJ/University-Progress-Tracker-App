import { DataSource } from 'typeorm';
import { Carrera } from '../../modules/carreras/entities/carrera.entity';
import { Materia } from '../../modules/materias/entities/materia.entity';
import { CarreraMateria } from '../../modules/carreras/entities/carrera-materia.entity';
import { Correlativa } from '../../modules/materias/entities/correlativa.entity';

const CARRERA = {
  nombre: 'Licenciatura en Informática',
  descripcion:
    'Carrera de grado orientada a la informática y el desarrollo de software.',
  duracionAnios: 5,
  materias: [
    // 1er Año - 1er Cuatrimestre
    {
      codigo: 'ILYPC',
      nombre: 'Introducción a lógica y Problemas Computacionales',
      cargaHoraria: 4,
      creditos: 7,
      anio: 1,
      cuatrimestre: 1,
    },
    {
      codigo: 'MPI1',
      nombre: 'Matemática para Informática 1',
      cargaHoraria: 4,
      creditos: 7,
      anio: 1,
      cuatrimestre: 1,
    },
    {
      codigo: 'OR1',
      nombre: 'Organización de las Computadoras 1',
      cargaHoraria: 4,
      creditos: 7,
      anio: 1,
      cuatrimestre: 1,
    },
    {
      codigo: 'CYAD',
      nombre: 'Cultura y alfabetización digital en la universidad',
      cargaHoraria: 2,
      creditos: 4,
      anio: 1,
      cuatrimestre: 1,
    },
    {
      codigo: 'TYS',
      nombre: 'Tecnología y Sociedad',
      cargaHoraria: 4,
      creditos: 4,
      anio: 1,
      cuatrimestre: 1,
    },

    // 1er Año - 2do Cuatrimestre
    {
      codigo: 'ING',
      nombre: 'Inglés',
      cargaHoraria: 2,
      creditos: 4,
      anio: 1,
      cuatrimestre: 2,
    },
    {
      codigo: 'PE',
      nombre: 'Programación Estructurada',
      cargaHoraria: 6,
      creditos: 7,
      anio: 1,
      cuatrimestre: 2,
      correlativas: ['ILYPC'],
    },
    {
      codigo: 'MPI2',
      nombre: 'Matemática para Informática 2',
      cargaHoraria: 4,
      creditos: 7,
      anio: 1,
      cuatrimestre: 2,
      correlativas: ['MPI1'],
    },
    {
      codigo: 'LI1',
      nombre: 'Lenguajes Informáticos 1',
      cargaHoraria: 4,
      creditos: 7,
      anio: 1,
      cuatrimestre: 2,
      correlativas: ['ILYPC'],
    },
    {
      codigo: 'OR2',
      nombre: 'Organización de Computadoras 2',
      cargaHoraria: 4,
      creditos: 5,
      anio: 1,
      cuatrimestre: 2,
      correlativas: ['OR1'],
    },

    // 2do Año - 1er Cuatrimestre
    {
      codigo: 'POO1',
      nombre: 'Programación con Objetos 1',
      cargaHoraria: 6,
      creditos: 7,
      anio: 2,
      cuatrimestre: 1,
      correlativas: ['PE'],
    },
    {
      codigo: 'ED',
      nombre: 'Estructuras de Datos',
      cargaHoraria: 6,
      creditos: 7,
      anio: 2,
      cuatrimestre: 1,
      correlativas: ['PE'],
    },
    {
      codigo: 'BD',
      nombre: 'Bases de Datos',
      cargaHoraria: 4,
      creditos: 7,
      anio: 2,
      cuatrimestre: 1,
      correlativas: ['ILYPC'],
    },
    {
      codigo: 'MPI3',
      nombre: 'Matemática para Informática 3',
      cargaHoraria: 4,
      creditos: 5,
      anio: 2,
      cuatrimestre: 1,
      correlativas: ['MPI2'],
    },
    {
      codigo: 'RD',
      nombre: 'Redes de Computadoras',
      cargaHoraria: 4,
      creditos: 5,
      anio: 2,
      cuatrimestre: 1,
      correlativas: ['OR1'],
    },

    // 2do Año - 2do Cuatrimestre
    {
      codigo: 'POO2',
      nombre: 'Programación con Objetos II',
      cargaHoraria: 6,
      creditos: 7,
      anio: 2,
      cuatrimestre: 2,
      correlativas: ['POO1'],
    },
    {
      codigo: 'AU',
      nombre: 'Asignatura UNAHUR',
      cargaHoraria: 2,
      creditos: 3,
      anio: 2,
      cuatrimestre: 2,
    },
    {
      codigo: 'SYO',
      nombre: 'Sistemas y organizaciones',
      cargaHoraria: 4,
      creditos: 6,
      anio: 2,
      cuatrimestre: 2,
      correlativas: ['PE'],
    },
    {
      codigo: 'ALG',
      nombre: 'Algoritmos',
      cargaHoraria: 4,
      creditos: 6,
      anio: 2,
      cuatrimestre: 2,
      correlativas: ['ED'],
    },
    {
      codigo: 'SO',
      nombre: 'Sistemas Operativos',
      cargaHoraria: 4,
      creditos: 6,
      anio: 2,
      cuatrimestre: 2,
      correlativas: ['OR1'],
    },

    // 3er Año - 1er Cuatrimestre
    {
      codigo: 'CIU',
      nombre: 'Construcción de Interfaces de Usuario',
      cargaHoraria: 4,
      creditos: 7,
      anio: 3,
      cuatrimestre: 1,
      correlativas: ['BD', 'POO2'],
    },
    {
      codigo: 'EP',
      nombre: 'Estrategias de Persistencia',
      cargaHoraria: 4,
      creditos: 7,
      anio: 3,
      cuatrimestre: 1,
      correlativas: ['BD', 'POO2'],
    },
    {
      codigo: 'IS1',
      nombre: 'Ingeniería de Software 1',
      cargaHoraria: 4,
      creditos: 7,
      anio: 3,
      cuatrimestre: 1,
      correlativas: ['SYO'],
    },
    {
      codigo: 'AL',
      nombre: 'Álgebra Lineal',
      cargaHoraria: 4,
      creditos: 5,
      anio: 3,
      cuatrimestre: 1,
      correlativas: ['MPI2'],
    },
    {
      codigo: 'EPT',
      nombre: 'Ejercicio Profesional en Tecnología',
      cargaHoraria: 4,
      creditos: 4,
      anio: 3,
      cuatrimestre: 1,
      correlativas: ['TYS'],
    },

    // 3er Año - 2do Cuatrimestre
    {
      codigo: 'DA',
      nombre: 'Desarrollo de Aplicaciones',
      cargaHoraria: 4,
      creditos: 6,
      anio: 3,
      cuatrimestre: 2,
      correlativas: ['CIU', 'EP', 'IS1'],
    },
    {
      codigo: 'LSOYR',
      nombre: 'Laboratorio de Sistemas Operativos y Redes',
      cargaHoraria: 4,
      creditos: 6,
      anio: 3,
      cuatrimestre: 2,
      correlativas: ['RD', 'SO', 'OR2'],
    },
    {
      codigo: 'LI2',
      nombre: 'Lenguajes Informáticos 2',
      cargaHoraria: 4,
      creditos: 5,
      anio: 3,
      cuatrimestre: 2,
      correlativas: ['MPI2', 'POO2', 'ALG'],
    },
    {
      codigo: 'AS1',
      nombre: 'Arquitectura de Software 1',
      cargaHoraria: 4,
      creditos: 6,
      anio: 3,
      cuatrimestre: 2,
      correlativas: ['CIU', 'EP', 'IS1'],
    },
    {
      codigo: 'MPI4',
      nombre: 'Matemática para Informática 4',
      cargaHoraria: 4,
      creditos: 5,
      anio: 3,
      cuatrimestre: 2,
      correlativas: ['MPI3', 'AL'],
    },

    // 4to Año - 1er Cuatrimestre
    {
      codigo: 'IS2',
      nombre: 'Ingeniería de Software 2',
      cargaHoraria: 4,
      creditos: 5,
      anio: 4,
      cuatrimestre: 1,
      correlativas: ['IS1'],
    },
    {
      codigo: 'PYE',
      nombre: 'Probabilidad y Estadística',
      cargaHoraria: 6,
      creditos: 5,
      anio: 4,
      cuatrimestre: 1,
      correlativas: ['MPI4'],
    },
    {
      codigo: 'LI3',
      nombre: 'Lenguajes Informáticos 3',
      cargaHoraria: 4,
      creditos: 5,
      anio: 4,
      cuatrimestre: 1,
      correlativas: ['PE', 'SO'],
    },
    {
      codigo: 'SI',
      nombre: 'Seguridad de la Información',
      cargaHoraria: 4,
      creditos: 5,
      anio: 4,
      cuatrimestre: 1,
      correlativas: ['LSOYR'],
    },
    {
      codigo: 'CYC',
      nombre: 'Computabilidad y Complejidad',
      cargaHoraria: 4,
      creditos: 5,
      anio: 4,
      cuatrimestre: 1,
      correlativas: ['ALG', 'AL'],
    },

    // 4to Año - 2do Cuatrimestre
    {
      codigo: 'FRN',
      nombre: 'Fundamentos de Redes Neuronales',
      cargaHoraria: 4,
      creditos: 5,
      anio: 4,
      cuatrimestre: 2,
      correlativas: ['PYE'],
    },
    {
      codigo: 'LI4',
      nombre: 'Lenguajes Informáticos 4',
      cargaHoraria: 6,
      creditos: 6,
      anio: 4,
      cuatrimestre: 2,
      correlativas: ['ALG', 'LI2'],
    },
    {
      codigo: 'FLYGC',
      nombre: 'Formalización de Lenguajes y Generación de Código',
      cargaHoraria: 4,
      creditos: 5,
      anio: 4,
      cuatrimestre: 2,
      correlativas: ['CYC'],
    },
    {
      codigo: 'AS2',
      nombre: 'Arquitectura de Software 2',
      cargaHoraria: 4,
      creditos: 5,
      anio: 4,
      cuatrimestre: 2,
      correlativas: ['AS1'],
    },
    {
      codigo: 'PPS',
      nombre: 'Práctica Profesional Supervisada',
      cargaHoraria: 4,
      creditos: 7,
      anio: 4,
      cuatrimestre: 2,
      correlativas: ['DA'],
    },

    // 5to Año - 1er Cuatrimestre
    {
      codigo: 'GPDS',
      nombre: 'Gestión de Proyectos de Desarrollo de Software',
      cargaHoraria: 4,
      creditos: 5,
      anio: 5,
      cuatrimestre: 1,
      correlativas: ['IS2'],
    },
    {
      codigo: 'AA',
      nombre: 'Aprendizaje Automático',
      cargaHoraria: 4,
      creditos: 6,
      anio: 5,
      cuatrimestre: 1,
      correlativas: ['FRN'],
    },
    {
      codigo: 'SDTR',
      nombre: 'Sistemas Distribuidos y Tiempo Real',
      cargaHoraria: 4,
      creditos: 5,
      anio: 5,
      cuatrimestre: 1,
      correlativas: ['LSOYR'],
    },
    {
      codigo: 'AC',
      nombre: 'Arquitectura de Computadoras',
      cargaHoraria: 4,
      creditos: 5,
      anio: 5,
      cuatrimestre: 1,
      correlativas: ['LSOYR'],
    },
    {
      codigo: 'PF',
      nombre: 'Proyecto final de Licenciatura',
      cargaHoraria: 6,
      creditos: 7,
      anio: 5,
      cuatrimestre: 1,
      correlativas: ['LI4', 'PPS'],
    },
  ],
};

export async function seedLicenciaturaInformatica(dataSource: DataSource) {
  const carreraRepo = dataSource.getRepository(Carrera);
  const materiaRepo = dataSource.getRepository(Materia);
  const planRepo = dataSource.getRepository(CarreraMateria);
  const correlRepo = dataSource.getRepository(Correlativa);

  const existe = await carreraRepo.findOne({
    where: { nombre: CARRERA.nombre },
  });
  if (existe) {
    console.log(`  · Carrera ya existe: ${CARRERA.nombre} (se omite)`);
    return;
  }

  const carrera = await carreraRepo.save(
    carreraRepo.create({
      nombre: CARRERA.nombre,
      descripcion: CARRERA.descripcion,
      duracionAnios: CARRERA.duracionAnios,
    }),
  );

  const materiasPorCodigo = new Map<string, Materia>();

  let orden = 0;
  for (const m of CARRERA.materias) {
    const materia = await materiaRepo.save(
      materiaRepo.create({
        codigo: m.codigo,
        nombre: m.nombre,
        cargaHoraria: m.cargaHoraria,
        creditos: m.creditos,
        descripcion: `Materia ${m.nombre}`,
      }),
    );
    materiasPorCodigo.set(m.codigo, materia);

    await planRepo.save(
      planRepo.create({
        carrera,
        materia,
        anio: m.anio,
        cuatrimestre: m.cuatrimestre,
        orden: ++orden,
      }),
    );
  }

  for (const m of CARRERA.materias) {
    if (!m.correlativas || m.correlativas.length === 0) continue;
    const materia = materiasPorCodigo.get(m.codigo)!;
    for (const cod of m.correlativas) {
      const materiaCorrelativa = materiasPorCodigo.get(cod);
      if (!materiaCorrelativa) continue;
      const existeCorr = await correlRepo.findOne({
        where: {
          materia: { materiaId: materia.materiaId },
          materiaCorrelativa: { materiaId: materiaCorrelativa.materiaId },
        },
      });
      if (!existeCorr) {
        await correlRepo.save(
          correlRepo.create({ materia, materiaCorrelativa, carrera }),
        );
      }
    }
  }

  console.log(
    `  ✓ Carrera creada: ${CARRERA.nombre} (${CARRERA.materias.length} materias)`,
  );
}
