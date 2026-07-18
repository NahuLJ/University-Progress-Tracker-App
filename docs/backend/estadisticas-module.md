# Módulo Estadísticas — Especificación Técnica


> ✅ **Implementado en `backend/`** — Código completo y compilando sin errores.

## Endpoints de la API

### GET /api/estadisticas/resumen?usuarioCarreraId=:id

Retorna un resumen completo de estadísticas académicas para una carrera específica del usuario.

| Código | Descripción |
|---|---|
| 200 | `{ promedioGeneral, materiasCompletadas, materiasEnProceso, materiasPendientes, totalMaterias, creditosObtenidos, creditosTotales, cuatrimestresRestantes, progresoPorcentaje }` |
| 404 | Inscripción no encontrada |

### GET /api/estadisticas/distribucion-estados?usuarioCarreraId=:id

Retorna el conteo de materias agrupadas por estado para gráficos visuales.

| Código | Descripción |
|---|---|
| 200 | `[{ estado: "Pendiente", cantidad: 12 }, { estado: "En Proceso", cantidad: 5 }, { estado: "Completada", cantidad: 18 }]` |

### GET /api/estadisticas/evolución?usuarioCarreraId=:id

Retorna el promedio histórico por cuatrimestre para generar gráficos de evolución académica.

| Código | Descripción |
|---|---|
| 200 | `[{ anio: 2024, cuatrimestre: 1, promedio: 7.5 }, { anio: 2024, cuatrimestre: 2, promedio: 8.2 }]` |

---

## DTOs

### ResumenResponseDto

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class ResumenResponseDto {
    @ApiProperty({ example: 7.83 })
    promedioGeneral: number;

    @ApiProperty({ example: 18 })
    materiasCompletadas: number;

    @ApiProperty({ example: 5 })
    materiasEnProceso: number;

    @ApiProperty({ example: 12 })
    materiasPendientes: number;

    @ApiProperty({ example: 35 })
    totalMaterias: number;

    @ApiProperty({ example: 144 })
    creditosObtenidos: number;

    @ApiProperty({ example: 280 })
    creditosTotales: number;

    @ApiProperty({ example: 4 })
    cuatrimestresRestantes: number;

    @ApiProperty({ example: 51.4 })
    progresoPorcentaje: number;
}
```

### DistribucionEstadosDto

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class DistribucionEstadosDto {
    @ApiProperty({ example: 'Pendiente' })
    estado: string;

    @ApiProperty({ example: 12 })
    cantidad: number;
}
```

---

## Lógica del Service

### EstadisticasService

```typescript
@Injectable()
export class EstadisticasService {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(UsuarioCarrera)
        private readonly usuarioCarreraRepo: Repository<UsuarioCarrera>,
        @InjectRepository(CarreraMateria)
        private readonly carreraMateriaRepo: Repository<CarreraMateria>,
        @InjectRepository(ProgresoMateria)
        private readonly progresoRepo: Repository<ProgresoMateria>,
    ) {}

    async obtenerResumen(usuarioCarreraId: number): Promise<ResumenResponseDto> {
        // 1. Verificar que la inscripción existe
        const inscripcion = await this.usuarioCarreraRepo.findOne({
            where: { usuarioCarreraId },
            relations: ['carrera'],
        });
        if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

        // 2. Obtener materias del plan de estudios
        const planEstudios = await this.carreraMateriaRepo.find({
            where: { carrera: { carreraId: inscripcion.carrera.carreraId } },
            relations: ['materia'],
        });
        const totalMaterias = planEstudios.length;
        const creditosTotales = planEstudios.reduce((sum, cm) => sum + cm.materia.creditos, 0);
        const idsMateriasPlan = planEstudios.map((cm) => cm.materia.materiaId);

        // 3. Obtener progreso del usuario para las materias de esta carrera
        const progresos = await this.progresoRepo.find({
            where: {
                usuarioCarrera: { usuarioCarreraId },
                materia: { materiaId: In(idsMateriasPlan) },
            },
            relations: ['estado', 'materia'],
        });

        // 4. Calcular indicadores
        const completadas = progresos.filter((p) => p.estado.nombre === 'Completada');
        const enProceso = progresos.filter((p) => p.estado.nombre === 'En Proceso');
        const pendientesRegistrados = progresos.filter((p) => p.estado.nombre === 'Pendiente');
        const sinRegistro = totalMaterias - progresos.length;

        const materiasCompletadas = completadas.length;
        const materiasEnProceso = enProceso.length;
        const materiasPendientes = pendientesRegistrados.length + sinRegistro;

        // Promedio general (solo materias completadas con nota)
        const notasValidas = completadas.filter((p) => p.nota !== null);
        const promedioGeneral = notasValidas.length > 0
            ? Math.round((notasValidas.reduce((sum, p) => sum + p.nota, 0) / notasValidas.length) * 100) / 100
            : 0;

        // Créditos obtenidos (materias completadas)
        const creditosObtenidos = completadas.reduce((sum, p) => {
            const cm = planEstudios.find((e) => e.materia.materiaId === p.materia.materiaId);
            return sum + (cm ? cm.materia.creditos : 0);
        }, 0);

        // Cuatrimestres restantes
        const cuatrimestresRestantes = await this.calcularCuatrimestresRestantes(
            inscripcion.carrera.carreraId,
            progresos,
        );

        // Porcentaje de progreso
        const progresoPorcentaje = totalMaterias > 0
            ? Math.round((materiasCompletadas / totalMaterias) * 1000) / 10
            : 0;

        return {
            promedioGeneral,
            materiasCompletadas,
            materiasEnProceso,
            materiasPendientes,
            totalMaterias,
            creditosObtenidos,
            creditosTotales,
            cuatrimestresRestantes,
            progresoPorcentaje,
        };
    }

    private async calcularCuatrimestresRestantes(
        carreraId: number,
        progresos: ProgresoMateria[],
    ): Promise<number> {
        // Obtener el plan de estudios completo
        const plan = await this.carreraMateriaRepo.find({
            where: { carrera: { carreraId } },
            order: { anio: 'ASC', cuatrimestre: 'ASC' },
        });

        if (plan.length === 0) return 0;

        // Identificar materias pendientes (no completadas)
        const materiasCompletadasIds = progresos
            .filter((p) => p.estado.nombre === 'Completada')
            .map((p) => p.materia.materiaId);

        const materiasPendientes = plan.filter(
            (cm) => !materiasCompletadasIds.includes(cm.materia.materiaId),
        );

        if (materiasPendientes.length === 0) return 0;

        // Agrupar el plan por cuatrimestre para calcular capacidad máxima
        const capacidadPorCuatrimestre: Record<string, number> = {};
        for (const cm of plan) {
            const key = `${cm.anio}-${cm.cuatrimestre}`;
            capacidadPorCuatrimestre[key] = (capacidadPorCuatrimestre[key] || 0) + 1;
        }
        const maxMateriasPorCuatrimestre = Math.max(...Object.values(capacidadPorCuatrimestre));

        // Calcular cuántos cuatrimestres se necesitan
        return Math.ceil(materiasPendientes.length / maxMateriasPorCuatrimestre);
    }

    async obtenerDistribucionEstados(usuarioCarreraId: number): Promise<DistribucionEstadosDto[]> {
        const inscripcion = await this.usuarioCarreraRepo.findOne({
            where: { usuarioCarreraId },
            relations: ['carrera'],
        });
        if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');

        const plan = await this.carreraMateriaRepo.find({
            where: { carrera: { carreraId: inscripcion.carrera.carreraId } },
        });
        const totalPlan = plan.length;

        const progresos = await this.progresoRepo.find({
            where: { usuarioCarrera: { usuarioCarreraId } },
            relations: ['estado'],
        });

        const completadas = progresos.filter((p) => p.estado.nombre === 'Completada').length;
        const enProceso = progresos.filter((p) => p.estado.nombre === 'En Proceso').length;
        const pendientes = totalPlan - completadas - enProceso;

        return [
            { estado: 'Completada', cantidad: completadas },
            { estado: 'En Proceso', cantidad: enProceso },
            { estado: 'Pendiente', cantidad: Math.max(0, pendientes) },
        ];
    }

    async obtenerEvolucion(usuarioCarreraId: number): Promise<any[]> {
        // Obtener materias completadas con fecha para agrupar por cuatrimestre académico
        const progresos = await this.progresoRepo.find({
            where: {
                usuarioCarrera: { usuarioCarreraId },
                estado: { nombre: 'Completada' },
                fechaCompletado: Not(IsNull()),
                nota: Not(IsNull()),
            },
            relations: ['materia'],
        });

        // Agrupar por año y cuatrimestre según la fecha de finalización
        const agrupado: Record<string, { sum: number; count: number }> = {};
        for (const p of progresos) {
            if (!p.fechaCompletado) continue;
            const [anioStr, mesStr] = p.fechaCompletado.split('-');
            const mes = parseInt(mesStr, 10);
            const anio = parseInt(anioStr, 10);
            // Cuatrimestre según mes: 1 (ene-abr), 2 (may-ago), verano (sep-dic)
            let cuatrimestre: number;
            if (mes <= 4) cuatrimestre = 1;
            else if (mes <= 8) cuatrimestre = 2;
            else cuatrimestre = 0; // Verano (considerado cuatrimestre 0)

            const key = `${anio}-${cuatrimestre}`;
            if (!agrupado[key]) agrupado[key] = { sum: 0, count: 0 };
            agrupado[key].sum += p.nota;
            agrupado[key].count += 1;
        }

        return Object.entries(agrupado)
            .map(([key, data]) => {
                const [anio, cuatrimestre] = key.split('-').map(Number);
                const instancia = cuatrimestre === 0 ? 'Verano' : `${cuatrimestre}° Cuatrimestre`;
                return {
                    anio,
                    cuatrimestre,
                    instancia,
                    promedio: Math.round((data.sum / data.count) * 100) / 100,
                    materiasAprobadas: data.count,
                };
            })
            .sort((a, b) => a.anio - b.anio || a.cuatrimestre - b.cuatrimestre);
    }
}
```

---

## Consultas SQL Directas (Alternativa con QueryBuilder)

Para alto volumen de datos, las consultas pueden ejecutarse directamente en SQL para mejor performance:

### Promedio General (SQL)

```sql
SELECT
    pm.usuario_carrera_id,
    ROUND(AVG(pm.nota), 2) AS promedio_general,
    COUNT(pm.nota) AS materias_consideradas
FROM progreso_materia pm
JOIN estado_materia em ON em.estado_id = pm.estado_id
WHERE em.nombre = 'Completada'
  AND pm.nota IS NOT NULL
  AND pm.usuario_carrera_id = ?
GROUP BY pm.usuario_carrera_id;
```

### Distribución de Estados (SQL)

```sql
SELECT
    COALESCE(em.nombre, 'Pendiente') AS estado,
    COUNT(*) AS cantidad
FROM carrera_materia cm
LEFT JOIN progreso_materia pm
    ON pm.materia_id = cm.materia_id
    AND pm.usuario_carrera_id = ?
LEFT JOIN estado_materia em ON em.estado_id = pm.estado_id
WHERE cm.carrera_id = (SELECT carrera_id FROM usuario_carrera WHERE usuario_carrera_id = ?)
GROUP BY em.nombre
ORDER BY FIELD(em.nombre, 'Completada', 'En Proceso', 'Pendiente');
```

### Créditos Obtenidos vs. Totales (SQL)

```sql
SELECT
    COALESCE(SUM(CASE WHEN em.nombre = 'Completada' THEN m.creditos ELSE 0 END), 0) AS creditos_obtenidos,
    SUM(m.creditos) AS creditos_totales
FROM carrera_materia cm
JOIN materia m ON m.materia_id = cm.materia_id
LEFT JOIN progreso_materia pm
    ON pm.materia_id = cm.materia_id
    AND pm.usuario_carrera_id = ?
LEFT JOIN estado_materia em ON em.estado_id = pm.estado_id
WHERE cm.carrera_id = (SELECT carrera_id FROM usuario_carrera WHERE usuario_carrera_id = ?);
```

---

## Fórmulas Matemáticas

### Promedio General

```
promedioGeneral = Σ(nota_i) / n
```

Donde `n` = cantidad de materias completadas con nota registrada. Rango: 4–10.

### Porcentaje de Progreso

```
progresoPorcentaje = (materiasCompletadas / totalMaterias) × 100
```

### Cuatrimestres Restantes

```
cuatrimestresRestantes = ⌈ materiasPendientes / maxMateriasPorCuatrimestre ⌉
```

Donde `maxMateriasPorCuatrimestre` es la mayor cantidad de materias que tiene un cuatrimestre en el plan de estudios. Se usa el techo (`ceil`) para redondear hacia arriba.

### Créditos Obtenidos

```
creditosObtenidos = Σ(creditos_i)  donde estado_i = 'Completada'
creditosTotales = Σ(creditos_i)  para todas las materias del plan
```
