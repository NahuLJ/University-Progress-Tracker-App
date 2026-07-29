import { DataSource } from 'typeorm';
import { Carrera } from '../../modules/carreras/entities/carrera.entity';
import { Materia } from '../../modules/materias/entities/materia.entity';
import { CarreraMateria } from '../../modules/carreras/entities/carrera-materia.entity';
import { Correlativa } from '../../modules/materias/entities/correlativa.entity';

const CARRERA = {
  nombre: 'Licenciatura en Ciberseguridad',
  descripcion:
    'Carrera de grado orientada a la ciberseguridad, redes y operaciones informáticas.',
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
      codigo: 'ISCS',
      nombre: 'Introducción a los Sistemas de Comunicación y Seguridad',
      cargaHoraria: 4,
      creditos: 10,
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
      codigo: 'TIC',
      nombre: 'Taller de Intérpretes de Comandos',
      cargaHoraria: 6,
      creditos: 9,
      anio: 1,
      cuatrimestre: 2,
      correlativas: ['ILYPC'],
      origen: 'nueva',
    },
    {
      codigo: 'OR1',
      nombre: 'Organización de las Computadoras 1',
      cargaHoraria: 4,
      creditos: 5,
      anio: 1,
      cuatrimestre: 2,
      origen: 'lic_info',
    },
    {
      codigo: 'BD',
      nombre: 'Bases de Datos',
      cargaHoraria: 4,
      creditos: 7,
      anio: 1,
      cuatrimestre: 2,
      correlativas: ['ILYPC'],
      origen: 'lic_info',
    },
    {
      codigo: 'TP',
      nombre: 'Taller de Programación',
      cargaHoraria: 6,
      creditos: 6,
      anio: 1,
      cuatrimestre: 2,
      correlativas: ['ILYPC'],
      origen: 'nueva',
    },

    // 2do Año - 1er Cuatrimestre
    {
      codigo: 'RD',
      nombre: 'Redes de Computadoras',
      cargaHoraria: 4,
      creditos: 5,
      anio: 2,
      cuatrimestre: 1,
      correlativas: ['OR1'],
      origen: 'lic_info',
    },
    {
      codigo: 'OR2',
      nombre: 'Organización de las Computadoras 2',
      cargaHoraria: 4,
      creditos: 5,
      anio: 2,
      cuatrimestre: 1,
      correlativas: ['OR1'],
      origen: 'lic_info',
    },
    {
      codigo: 'SO',
      nombre: 'Sistemas Operativos',
      cargaHoraria: 4,
      creditos: 6,
      anio: 2,
      cuatrimestre: 1,
      correlativas: ['OR1'],
      origen: 'lic_info',
    },
    {
      codigo: 'OPS',
      nombre: 'Operaciones',
      cargaHoraria: 4,
      creditos: 9,
      anio: 2,
      cuatrimestre: 1,
      correlativas: ['ISCS', 'TIC'],
      origen: 'nueva',
    },

    // 2do Año - 2do Cuatrimestre
    {
      codigo: 'AU',
      nombre: 'Asignatura UNAHUR',
      cargaHoraria: 2,
      creditos: 3,
      anio: 2,
      cuatrimestre: 2,
      origen: 'lic_info',
    },
    {
      codigo: 'RDA',
      nombre: 'Redes Avanzadas',
      cargaHoraria: 4,
      creditos: 10,
      anio: 2,
      cuatrimestre: 2,
      correlativas: ['RD'],
      origen: 'nueva',
    },
    {
      codigo: 'SI',
      nombre: 'Seguridad de la Información',
      cargaHoraria: 4,
      creditos: 5,
      anio: 2,
      cuatrimestre: 2,
      correlativas: ['RD', 'SO'],
      origen: 'lic_info',
    },
    {
      codigo: 'DSO',
      nombre: 'Desarrollo, Seguridad y Operaciones',
      cargaHoraria: 4,
      creditos: 10,
      anio: 2,
      cuatrimestre: 2,
      correlativas: ['TP', 'OPS'],
      origen: 'nueva',
    },

    // 3er Año - 1er Cuatrimestre
    {
      codigo: 'LI',
      nombre: 'Lenguajes Informáticos',
      cargaHoraria: 4,
      creditos: 5,
      anio: 3,
      cuatrimestre: 1,
      correlativas: ['TP', 'SO'],
      origen: 'nueva',
    },
    {
      codigo: 'LSOYR',
      nombre: 'Laboratorio de Sistemas Operativos y Redes',
      cargaHoraria: 4,
      creditos: 7,
      anio: 3,
      cuatrimestre: 1,
      correlativas: ['RD', 'OR2', 'SO'],
      origen: 'lic_info',
    },
    {
      codigo: 'MPI2',
      nombre: 'Matemática para Informática 2',
      cargaHoraria: 4,
      creditos: 7,
      anio: 3,
      cuatrimestre: 1,
      correlativas: ['MPI1'],
      origen: 'lic_info',
    },
    {
      codigo: 'GIS',
      nombre: 'Gestión Integral de Seguridad',
      cargaHoraria: 4,
      creditos: 7,
      anio: 3,
      cuatrimestre: 1,
      correlativas: ['SI'],
      origen: 'nueva',
    },

    // 3er Año - 2do Cuatrimestre
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
      codigo: 'DS',
      nombre: 'Desarrollo Seguro',
      cargaHoraria: 4,
      creditos: 8,
      anio: 3,
      cuatrimestre: 2,
      correlativas: ['BD', 'DSO'],
      origen: 'nueva',
    },
    {
      codigo: 'CYAF',
      nombre: 'Cibercrimen y Análisis Forense',
      cargaHoraria: 4,
      creditos: 7,
      anio: 3,
      cuatrimestre: 2,
      correlativas: ['RDA', 'SI'],
      origen: 'nueva',
    },
    {
      codigo: 'CRIP',
      nombre: 'Criptografía',
      cargaHoraria: 4,
      creditos: 7,
      anio: 3,
      cuatrimestre: 2,
      correlativas: ['MPI2'],
      origen: 'nueva',
    },

    // 4to Año - 1er Cuatrimestre
    {
      codigo: 'CSN',
      nombre: 'Ciberseguridad en la Nube',
      cargaHoraria: 4,
      creditos: 7,
      anio: 4,
      cuatrimestre: 1,
      correlativas: ['DS'],
      origen: 'nueva',
    },
    {
      codigo: 'CSO',
      nombre: 'Ciberseguridad Ofensiva',
      cargaHoraria: 4,
      creditos: 7,
      anio: 4,
      cuatrimestre: 1,
      correlativas: ['LI', 'DS'],
      origen: 'nueva',
    },
    {
      codigo: 'ARI',
      nombre: 'Administración y Respuesta a Incidentes',
      cargaHoraria: 4,
      creditos: 7,
      anio: 4,
      cuatrimestre: 1,
      correlativas: ['GIS'],
      origen: 'nueva',
    },
    {
      codigo: 'PPS',
      nombre: 'Práctica Profesional Supervisada',
      cargaHoraria: 4,
      creditos: 7,
      anio: 4,
      cuatrimestre: 1,
      correlativas: ['LSOYR', 'DS'],
      origen: 'lic_info',
    },

    // 4to Año - 2do Cuatrimestre
    {
      codigo: 'CCI',
      nombre: 'Ciberdefensa y Ciberinteligencia',
      cargaHoraria: 4,
      creditos: 7,
      anio: 4,
      cuatrimestre: 2,
      correlativas: ['CYAF'],
      origen: 'nueva',
    },
    {
      codigo: 'CSD',
      nombre: 'Ciberseguridad Defensiva',
      cargaHoraria: 4,
      creditos: 8,
      anio: 4,
      cuatrimestre: 2,
      correlativas: ['CSO', 'ARI'],
      origen: 'nueva',
    },
    {
      codigo: 'PF',
      nombre: 'Proyecto Final',
      cargaHoraria: 6,
      creditos: 7,
      anio: 4,
      cuatrimestre: 2,
      correlativas: ['CSN', 'CSO', 'PPS'],
      origen: 'lic_info',
    },
  ],
};

export async function seedLicenciaturaCiberseguridad(dataSource: DataSource) {
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