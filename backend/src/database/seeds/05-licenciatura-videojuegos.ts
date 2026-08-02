import { DataSource } from 'typeorm';
import { Carrera } from '../../modules/carreras/entities/carrera.entity';
import { Materia } from '../../modules/materias/entities/materia.entity';
import { CarreraMateria } from '../../modules/carreras/entities/carrera-materia.entity';
import { Correlativa } from '../../modules/materias/entities/correlativa.entity';

const CARRERA = {
  nombre: 'Licenciatura en Desarrollo de Videojuegos y Simulaciones',
  descripcion:
    'Carrera de grado orientada al desarrollo de videojuegos, simulaciones y tecnologías interactivas.',
  duracionAnios: 4,
  materias: [
    // 1er Año - 1er Cuatrimestre
    {
      codigo: 'MPI1',
      nombre: 'Matemática para Informática 1',
      cargaHoraria: 4,
      creditos: 7,
      anio: 1,
      cuatrimestre: 1,
      origen: 'lic_info',
    },
    {
      codigo: 'ILYPC',
      nombre: 'Introducción a lógica y Problemas Computacionales',
      cargaHoraria: 4,
      creditos: 7,
      anio: 1,
      cuatrimestre: 1,
      origen: 'lic_info',
    },
    {
      codigo: 'IVJ',
      nombre: 'Introducción a los Videojuegos',
      cargaHoraria: 6,
      creditos: 8,
      anio: 1,
      cuatrimestre: 1,
      origen: 'nueva',
    },
    {
      codigo: 'CYAD',
      nombre: 'Cultura y alfabetización digital en la universidad',
      cargaHoraria: 2,
      creditos: 4,
      anio: 1,
      cuatrimestre: 1,
      origen: 'lic_info',
    },

    // 1er Año - 2do Cuatrimestre
    {
      codigo: 'TDCJ',
      nombre: 'Taller de diseño conceptual de juegos',
      cargaHoraria: 4,
      creditos: 7,
      anio: 1,
      cuatrimestre: 2,
      correlativas: ['IVJ'],
      origen: 'nueva',
    },
    {
      codigo: 'TP',
      nombre: 'Taller de programación',
      cargaHoraria: 4,
      creditos: 7,
      anio: 1,
      cuatrimestre: 2,
      correlativas: ['ILYPC'],
      origen: 'nueva',
    },
    {
      codigo: 'ADV',
      nombre: 'Arte digital para videojuegos',
      cargaHoraria: 4,
      creditos: 8,
      anio: 1,
      cuatrimestre: 2,
      correlativas: ['IVJ'],
      origen: 'nueva',
    },
    {
      codigo: 'AU',
      nombre: 'Asignatura UNAHUR',
      cargaHoraria: 2,
      creditos: 3,
      anio: 1,
      cuatrimestre: 2,
      origen: 'lic_info',
    },

    // 2do Año - 1er Cuatrimestre
    {
      codigo: 'POO',
      nombre: 'Programación con Objetos',
      cargaHoraria: 6,
      creditos: 7,
      anio: 2,
      cuatrimestre: 1,
      correlativas: ['TP'],
      origen: 'nueva',
    },
    {
      codigo: 'DIXU',
      nombre: 'Diseño de Interfaces y Experiencia de Usuario',
      cargaHoraria: 4,
      creditos: 7,
      anio: 2,
      cuatrimestre: 1,
      correlativas: ['ADV'],
      origen: 'nueva',
    },
    {
      codigo: 'IMV',
      nombre: 'Introducción a Motores de Videojuegos',
      cargaHoraria: 4,
      creditos: 7,
      anio: 2,
      cuatrimestre: 1,
      correlativas: ['ILYPC'],
      origen: 'nueva',
    },
    {
      codigo: 'PVJ1',
      nombre: 'Programación de Videojuegos I',
      cargaHoraria: 4,
      creditos: 6,
      anio: 2,
      cuatrimestre: 1,
      correlativas: ['TP'],
      origen: 'nueva',
    },

    // 2do Año - 2do Cuatrimestre
    {
      codigo: 'PN',
      nombre: 'Planificación de Negocios',
      cargaHoraria: 4,
      creditos: 7,
      anio: 2,
      cuatrimestre: 2,
      correlativas: ['PVJ1'],
      origen: 'nueva',
    },
    {
      codigo: 'BD',
      nombre: 'Bases de Datos',
      cargaHoraria: 4,
      creditos: 7,
      anio: 2,
      cuatrimestre: 2,
      correlativas: ['ILYPC'],
      origen: 'lic_info',
    },
    {
      codigo: 'EIS',
      nombre: 'Elementos de Ingeniería de Software',
      cargaHoraria: 4,
      creditos: 7,
      anio: 2,
      cuatrimestre: 2,
      correlativas: ['POO'],
      origen: 'nueva',
    },
    {
      codigo: 'PVJ2',
      nombre: 'Programación de Videojuegos II',
      cargaHoraria: 6,
      creditos: 9,
      anio: 2,
      cuatrimestre: 2,
      correlativas: ['DIXU', 'IMV', 'PVJ1'],
      origen: 'nueva',
    },

    // 3er Año - 1er Cuatrimestre
    {
      codigo: 'DL',
      nombre: 'Diseño Lúdico',
      cargaHoraria: 4,
      creditos: 7,
      anio: 3,
      cuatrimestre: 1,
      correlativas: ['TDCJ'],
      origen: 'nueva',
    },
    {
      codigo: 'TI',
      nombre: 'Tecnologías Interactivas',
      cargaHoraria: 4,
      creditos: 7,
      anio: 3,
      cuatrimestre: 1,
      correlativas: ['ILYPC'],
      origen: 'nueva',
    },
    {
      codigo: 'CAD',
      nombre: 'Ciencias aplicadas al Diseño',
      cargaHoraria: 4,
      creditos: 6,
      anio: 3,
      cuatrimestre: 1,
      correlativas: ['MPI1'],
      origen: 'nueva',
    },
    {
      codigo: 'SIM1',
      nombre: 'Simulación I',
      cargaHoraria: 4,
      creditos: 7,
      anio: 3,
      cuatrimestre: 1,
      correlativas: ['TP'],
      origen: 'nueva',
    },

    // 3er Año - 2do Cuatrimestre
    {
      codigo: 'DA3D',
      nombre: 'Diseño y Animación 3D',
      cargaHoraria: 4,
      creditos: 7,
      anio: 3,
      cuatrimestre: 2,
      correlativas: ['ADV'],
      origen: 'nueva',
    },
    {
      codigo: 'SIM2',
      nombre: 'Simulación II',
      cargaHoraria: 4,
      creditos: 7,
      anio: 3,
      cuatrimestre: 2,
      correlativas: ['EIS', 'SIM1'],
      origen: 'nueva',
    },
    {
      codigo: 'TYS',
      nombre: 'Tecnología y Sociedad',
      cargaHoraria: 4,
      creditos: 4,
      anio: 3,
      cuatrimestre: 2,
      origen: 'lic_info',
    },
    {
      codigo: 'MPI2',
      nombre: 'Matemática para Informática 2',
      cargaHoraria: 4,
      creditos: 7,
      anio: 3,
      cuatrimestre: 2,
      correlativas: ['MPI1'],
      origen: 'lic_info',
    },

    // 4to Año - 1er Cuatrimestre
    {
      codigo: 'SIM3',
      nombre: 'Simulación III',
      cargaHoraria: 4,
      creditos: 7,
      anio: 4,
      cuatrimestre: 1,
      correlativas: ['CAD', 'SIM2'],
      origen: 'nueva',
    },
    {
      codigo: 'PVJ3',
      nombre: 'Programación de Videojuegos III',
      cargaHoraria: 4,
      creditos: 8,
      anio: 4,
      cuatrimestre: 1,
      correlativas: ['BD', 'PVJ2'],
      origen: 'nueva',
    },
    {
      codigo: 'CG',
      nombre: 'Computación Gráfica',
      cargaHoraria: 4,
      creditos: 7,
      anio: 4,
      cuatrimestre: 1,
      correlativas: ['DA3D', 'MPI2'],
      origen: 'nueva',
    },
    {
      codigo: 'PPS',
      nombre: 'Práctica Profesional Supervisada',
      cargaHoraria: 4,
      creditos: 7,
      anio: 4,
      cuatrimestre: 1,
      correlativas: ['PVJ2', 'SIM2'],
      origen: 'lic_info',
    },

    // 4to Año - 2do Cuatrimestre
    {
      codigo: 'ROB',
      nombre: 'Robótica',
      cargaHoraria: 4,
      creditos: 7,
      anio: 4,
      cuatrimestre: 2,
      correlativas: ['TI'],
      origen: 'nueva',
    },
    {
      codigo: 'EV',
      nombre: 'Entornos Virtuales',
      cargaHoraria: 6,
      creditos: 7,
      anio: 4,
      cuatrimestre: 2,
      correlativas: ['PVJ3'],
      origen: 'nueva',
    },
    {
      codigo: 'PF',
      nombre: 'Proyecto Final',
      cargaHoraria: 4,
      creditos: 7,
      anio: 4,
      cuatrimestre: 2,
      correlativas: ['PVJ3', 'CG', 'PPS'],
      origen: 'lic_info',
    },
  ],
};

export async function seedLicenciaturaVideojuegos(dataSource: DataSource) {
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
    let materia = await materiaRepo.findOne({
      where: { codigo: m.codigo },
    });

    if (!materia) {
      materia = await materiaRepo.save(
        materiaRepo.create({
          codigo: m.codigo,
          nombre: m.nombre,
          cargaHoraria: m.cargaHoraria,
          creditos: m.creditos,
          descripcion: `Materia ${m.nombre}`,
        }),
      );
    }
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
          carrera: { carreraId: carrera.carreraId },
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
