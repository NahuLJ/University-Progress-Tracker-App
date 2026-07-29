import { DataSource } from 'typeorm';
import { Carrera } from '../../modules/carreras/entities/carrera.entity';
import { Materia } from '../../modules/materias/entities/materia.entity';
import { CarreraMateria } from '../../modules/carreras/entities/carrera-materia.entity';
import { Correlativa } from '../../modules/materias/entities/correlativa.entity';

const CARRERA = {
  nombre: 'Tecnicatura Universitaria en Inteligencia Artificial',
  descripcion:
    'Carrera de pregrado orientada a la inteligencia artificial, ciencia de datos y aprendizaje automático.',
  duracionAnios: 3,
  materias: [
    // 1er Año - 1er Cuatrimestre
    {
      codigo: 'MPI1',
      nombre: 'Matemática para Informática',
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
      codigo: 'IIA',
      nombre: 'Introducción a la inteligencia artificial',
      cargaHoraria: 4,
      creditos: 5,
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
      codigo: 'AL',
      nombre: 'Álgebra Lineal',
      cargaHoraria: 4,
      creditos: 5,
      anio: 1,
      cuatrimestre: 2,
      correlativas: ['MPI1'],
      origen: 'lic_info',
    },
    {
      codigo: 'CALC',
      nombre: 'Cálculo',
      cargaHoraria: 6,
      creditos: 6,
      anio: 1,
      cuatrimestre: 2,
      correlativas: ['MPI1'],
      origen: 'nueva',
    },
    {
      codigo: 'TPI',
      nombre: 'Taller de Programación I',
      cargaHoraria: 4,
      creditos: 6,
      anio: 1,
      cuatrimestre: 2,
      correlativas: ['ILYPC'],
      origen: 'nueva',
    },
    {
      codigo: 'TYS',
      nombre: 'Tecnología y Sociedad',
      cargaHoraria: 4,
      creditos: 4,
      anio: 1,
      cuatrimestre: 2,
      origen: 'lic_info',
    },

    // 2do Año - 1er Cuatrimestre
    {
      codigo: 'BD',
      nombre: 'Bases de Datos',
      cargaHoraria: 4,
      creditos: 7,
      anio: 2,
      cuatrimestre: 1,
      correlativas: ['ILYPC'],
      origen: 'lic_info',
    },
    {
      codigo: 'PYE',
      nombre: 'Probabilidad y Estadística',
      cargaHoraria: 6,
      creditos: 5,
      anio: 2,
      cuatrimestre: 1,
      correlativas: ['AL', 'CALC'],
      origen: 'lic_info',
    },
    {
      codigo: 'TPII',
      nombre: 'Taller de Programación II',
      cargaHoraria: 4,
      creditos: 5,
      anio: 2,
      cuatrimestre: 1,
      correlativas: ['TPI'],
      origen: 'nueva',
    },
    {
      codigo: 'FCD',
      nombre: 'Fundamentos de Ciencias de Datos',
      cargaHoraria: 4,
      creditos: 5,
      anio: 2,
      cuatrimestre: 1,
      correlativas: ['IIA', 'AL', 'CALC'],
      origen: 'nueva',
    },

    // 2do Año - 2do Cuatrimestre
    {
      codigo: 'FRN',
      nombre: 'Fundamentos de Redes Neuronales',
      cargaHoraria: 4,
      creditos: 5,
      anio: 2,
      cuatrimestre: 2,
      correlativas: ['FCD'],
      origen: 'lic_info',
    },
    {
      codigo: 'AA',
      nombre: 'Aprendizaje Automático',
      cargaHoraria: 4,
      creditos: 6,
      anio: 2,
      cuatrimestre: 2,
      correlativas: ['TPII', 'FCD'],
      origen: 'lic_info',
    },
    {
      codigo: 'TPIII',
      nombre: 'Taller de Programación III',
      cargaHoraria: 4,
      creditos: 5,
      anio: 2,
      cuatrimestre: 2,
      correlativas: ['TPII'],
      origen: 'nueva',
    },
    {
      codigo: 'ING',
      nombre: 'Inglés',
      cargaHoraria: 2,
      creditos: 4,
      anio: 2,
      cuatrimestre: 2,
      origen: 'lic_info',
    },

    // 3er Año - 1er Cuatrimestre
    {
      codigo: 'AU',
      nombre: 'Asignatura UNAHUR',
      cargaHoraria: 2,
      creditos: 3,
      anio: 3,
      cuatrimestre: 1,
      origen: 'lic_info',
    },
    {
      codigo: 'AAA',
      nombre: 'Aprendizaje Automático Avanzado',
      cargaHoraria: 6,
      creditos: 6,
      anio: 3,
      cuatrimestre: 1,
      correlativas: ['AA', 'TPIII'],
      origen: 'nueva',
    },
    {
      codigo: 'PIVC',
      nombre: 'Procesamiento de Imágenes y Visión por Computadora',
      cargaHoraria: 4,
      creditos: 5,
      anio: 3,
      cuatrimestre: 1,
      correlativas: ['AA', 'TPIII'],
      origen: 'nueva',
    },
    {
      codigo: 'PI',
      nombre: 'Proyecto Integrador',
      cargaHoraria: 6,
      creditos: 8,
      anio: 3,
      cuatrimestre: 1,
      correlativas: ['AA', 'TPIII'],
      origen: 'nueva',
    },
  ],
};

export async function seedTecnicaturaIA(dataSource: DataSource) {
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