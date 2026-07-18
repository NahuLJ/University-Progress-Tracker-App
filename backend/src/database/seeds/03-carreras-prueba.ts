import { DataSource } from 'typeorm';
import { Carrera } from '../../modules/carreras/entities/carrera.entity';
import { Materia } from '../../modules/materias/entities/materia.entity';
import { CarreraMateria } from '../../modules/carreras/entities/carrera-materia.entity';
import { Correlativa } from '../../modules/materias/entities/correlativa.entity';
import { Usuario } from '../../modules/usuarios/entities/usuario.entity';
import { UsuarioCarrera } from '../../modules/carreras/entities/usuario-carrera.entity';
import { ProgresoMateria } from '../../modules/progreso/entities/progreso-materia.entity';
import { EstadoMateria } from '../../modules/progreso/entities/estado-materia.entity';
import * as bcrypt from 'bcrypt';

interface MateriaSeed {
  codigo: string;
  nombre: string;
  cargaHoraria: number;
  creditos: number;
  anio: number;
  cuatrimestre: number;
  correlativas?: string[];
}

const CARRERAS: { nombre: string; descripcion: string; duracionAnios: number; materias: MateriaSeed[] }[] = [
  {
    nombre: 'Ingeniería en Sistemas de Información',
    descripcion: 'Carrera de grado orientada al desarrollo de software y sistemas.',
    duracionAnios: 5.5,
    materias: [
      { codigo: 'ASIS1', nombre: 'Algoritmos y Estructuras de Datos I', cargaHoraria: 120, creditos: 8, anio: 1, cuatrimestre: 1 },
      { codigo: 'ASIS2', nombre: 'Algoritmos y Estructuras de Datos II', cargaHoraria: 120, creditos: 8, anio: 1, cuatrimestre: 2, correlativas: ['ASIS1'] },
      { codigo: 'MAT1', nombre: 'Análisis Matemático I', cargaHoraria: 120, creditos: 8, anio: 1, cuatrimestre: 1 },
      { codigo: 'MAT2', nombre: 'Análisis Matemático II', cargaHoraria: 120, creditos: 8, anio: 1, cuatrimestre: 2, correlativas: ['MAT1'] },
      { codigo: 'POO', nombre: 'Programación Orientada a Objetos', cargaHoraria: 120, creditos: 8, anio: 2, cuatrimestre: 1, correlativas: ['ASIS1'] },
      { codigo: 'BD1', nombre: 'Bases de Datos I', cargaHoraria: 120, creditos: 8, anio: 2, cuatrimestre: 1, correlativas: ['ASIS1'] },
      { codigo: 'BD2', nombre: 'Bases de Datos II', cargaHoraria: 120, creditos: 8, anio: 2, cuatrimestre: 2, correlativas: ['BD1'] },
      { codigo: 'SISOP', nombre: 'Sistemas Operativos', cargaHoraria: 120, creditos: 8, anio: 2, cuatrimestre: 2, correlativas: ['ASIS2'] },
      { codigo: 'RED', nombre: 'Redes de Computadoras', cargaHoraria: 120, creditos: 8, anio: 3, cuatrimestre: 1, correlativas: ['SISOP'] },
      { codigo: 'INGSW', nombre: 'Ingeniería de Software', cargaHoraria: 120, creditos: 8, anio: 3, cuatrimestre: 1, correlativas: ['POO'] },
      { codigo: 'WEB', nombre: 'Desarrollo Web', cargaHoraria: 120, creditos: 8, anio: 3, cuatrimestre: 2, correlativas: ['INGSW', 'BD1'] },
      { codigo: 'IA', nombre: 'Inteligencia Artificial', cargaHoraria: 120, creditos: 8, anio: 4, cuatrimestre: 1, correlativas: ['BD2', 'ASIS2'] },
    ],
  },
  {
    nombre: 'Licenciatura en Administración',
    descripcion: 'Carrera orientada a la gestión y dirección de organizaciones.',
    duracionAnios: 4.5,
    materias: [
      { codigo: 'ADM1', nombre: 'Introducción a la Administración', cargaHoraria: 90, creditos: 6, anio: 1, cuatrimestre: 1 },
      { codigo: 'ECON1', nombre: 'Economía I', cargaHoraria: 90, creditos: 6, anio: 1, cuatrimestre: 1 },
      { codigo: 'ECON2', nombre: 'Economía II', cargaHoraria: 90, creditos: 6, anio: 1, cuatrimestre: 2, correlativas: ['ECON1'] },
      { codigo: 'CONT1', nombre: 'Contabilidad I', cargaHoraria: 90, creditos: 6, anio: 1, cuatrimestre: 2, correlativas: ['ADM1'] },
      { codigo: 'MKT', nombre: 'Marketing', cargaHoraria: 90, creditos: 6, anio: 2, cuatrimestre: 1, correlativas: ['ADM1'] },
      { codigo: 'FIN', nombre: 'Finanzas', cargaHoraria: 90, creditos: 6, anio: 2, cuatrimestre: 2, correlativas: ['CONT1', 'ECON2'] },
      { codigo: 'RRHH', nombre: 'Gestión de Recursos Humanos', cargaHoraria: 90, creditos: 6, anio: 2, cuatrimestre: 2, correlativas: ['ADM1'] },
      { codigo: 'OP', nombre: 'Administración de Operaciones', cargaHoraria: 90, creditos: 6, anio: 3, cuatrimestre: 1, correlativas: ['MKT'] },
      { codigo: 'STRAT', nombre: 'Estrategia Competitiva', cargaHoraria: 90, creditos: 6, anio: 4, cuatrimestre: 1, correlativas: ['FIN', 'OP'] },
    ],
  },
];

export async function seedCarrerasPrueba(dataSource: DataSource) {
  const carreraRepo = dataSource.getRepository(Carrera);
  const materiaRepo = dataSource.getRepository(Materia);
  const planRepo = dataSource.getRepository(CarreraMateria);
  const correlRepo = dataSource.getRepository(Correlativa);
  const usuarioRepo = dataSource.getRepository(Usuario);
  const ucRepo = dataSource.getRepository(UsuarioCarrera);
  const progRepo = dataSource.getRepository(ProgresoMateria);
  const estadoRepo = dataSource.getRepository(EstadoMateria);

  const estados = await estadoRepo.find();
  const estadoPorNombre = new Map(estados.map((e) => [e.nombre, e]));

  for (const c of CARRERAS) {
    const existe = await carreraRepo.findOne({ where: { nombre: c.nombre } });
    if (existe) {
      console.log(`  · Carrera ya existe: ${c.nombre} (se omite)`);
      continue;
    }

    const carrera = await carreraRepo.save(
      carreraRepo.create({ nombre: c.nombre, descripcion: c.descripcion, duracionAnios: c.duracionAnios }),
    );

    const materiasPorCodigo = new Map<string, Materia>();

    let orden = 0;
    for (const m of c.materias) {
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

    for (const m of c.materias) {
      if (!m.correlativas || m.correlativas.length === 0) continue;
      const materia = materiasPorCodigo.get(m.codigo)!;
      for (const cod of m.correlativas) {
        const materiaCorrelativa = materiasPorCodigo.get(cod);
        if (!materiaCorrelativa) continue;
        const existeCorr = await correlRepo.findOne({
          where: { materia: { materiaId: materia.materiaId }, materiaCorrelativa: { materiaId: materiaCorrelativa.materiaId } },
        });
        if (!existeCorr) {
          await correlRepo.save(correlRepo.create({ materia, materiaCorrelativa }));
        }
      }
    }

    console.log(`  ✓ Carrera creada: ${c.nombre} (${c.materias.length} materias)`);
  }

  const email = 'test@universidad.app';
  let usuario = await usuarioRepo.findOne({ where: { email } });
  if (!usuario) {
    const passwordHash = await bcrypt.hash('Password123', 10);
    usuario = await usuarioRepo.save(
      usuarioRepo.create({ nombre: 'Usuario de Prueba', email, passwordHash }),
    );
    console.log(`  ✓ Usuario de prueba creado: ${email} / Password123`);
  } else {
    console.log(`  · Usuario de prueba ya existe: ${email}`);
  }

  for (const c of CARRERAS) {
    const carrera = await carreraRepo.findOne({ where: { nombre: c.nombre } });
    if (!carrera) continue;

    let uc = await ucRepo.findOne({ where: { usuario: { usuarioId: usuario.usuarioId }, carrera: { carreraId: carrera.carreraId } } });
    if (!uc) {
      uc = await ucRepo.save(
        ucRepo.create({
          usuario,
          carrera,
          fechaInicio: '2025-03-01',
          activo: true,
        }),
      );
    }

    const planes = await planRepo.find({
      where: { carrera: { carreraId: carrera.carreraId } },
      relations: { materia: true },
    });

    for (const plan of planes) {
      const existeProgreso = await progRepo.findOne({
        where: { usuarioCarrera: { usuarioCarreraId: uc.usuarioCarreraId }, materia: { materiaId: plan.materia.materiaId } },
      });
      if (existeProgreso) continue;

      const estado = estadoPorNombre.get('Pendiente')!;
      await progRepo.save(
        progRepo.create({
          usuarioCarrera: uc,
          materia: plan.materia,
          estado,
          nota: null,
          tipoAprobacion: null,
          fechaCompletado: null,
        }),
      );
    }
  }

  console.log('  ✓ Inscripción y progreso de prueba listos');
}
