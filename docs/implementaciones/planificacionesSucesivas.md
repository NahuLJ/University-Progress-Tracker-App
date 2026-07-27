# Planificaciones Sucesivas — Documento de Implementación

## 1. Resumen del requerimiento

Actualmente cada `PeriodoPlanificacion` es independiente. Se planifican solo las materias disponibles en el momento (completadas sus correlativas). El objetivo es permitir **encadenar planificaciones** dentro de una **trayectoria**, de modo que las materias planificadas en un periodo "desbloqueen" correlativas para los periodos siguientes, y así armar un camino de planificación a largo plazo.

Una **trayectoria** contiene N planificaciones ordenadas cronológicamente (por año e instancia). Las planificaciones pueden bifurcarse: una misma planificación puede tener múltiples continuaciones (por ejemplo, "Variante A" vs "Variante B").

---

## 2. Modelo de datos

### 2.1 Nueva tabla: `trayectoria`

```
trayectoria_id   INT PK AUTO_INCREMENT
usuario_carrera_id   INT FK → usuario_carrera.usuario_carrera_id  NOT NULL
nombre               VARCHAR(150)  NOT NULL
creado_en            TIMESTAMP  DEFAULT CURRENT_TIMESTAMP
```

**Índices:**
- UNIQUE `(usuario_carrera_id, nombre)` — no repetir nombre de trayectoria por carrera.
- FK `usuario_carrera_id → usuario_carrera` con ON DELETE CASCADE.

### 2.2 Modificación: `periodo_planificacion`

Se agregan dos columnas:
```
trayectoria_id       INT FK → trayectoria.trayectoria_id    NULL
  — NULL significa planificación "suelta" (comportamiento actual).
  — NOT NULL si pertenece a una trayectoria.

planificacion_origen_id   INT FK → periodo_planificacion.periodo_id   NULL
  — ID de la planificación que le da continuidad (solo válido dentro de una trayectoria).
  — NULL si es la primera planificación de la trayectoria.
```

**Restricciones:**
- Si `trayectoria_id` IS NOT NULL, entonces `(trayectoria_id, anio, instancia)` debe respetar el orden cronológico dentro de la trayectoria: no puede haber una planificación con año/instancia anterior o igual a la anterior dentro de la misma trayectoria.
- Si `planificacion_origen_id` IS NOT NULL, entonces `trayectoria_id` también debe ser NOT NULL.
- `planificacion_origen_id` debe pertenecer a la misma `trayectoria_id`.

### 2.3 Nuevo estado: `planificado` en `estado_materia`

Para que el cálculo de materias desbloqueables funcione en modo sucesivo, las materias planificadas en una planificación anterior deben tratarse como si estuvieran "completadas" a efectos de correlativas.

Añadir un nuevo catálogo:
```
estado_materia_id = 4, nombre = 'Planificado'
```

Este estado no se persiste en `progreso_materia` (eso es real), sino que se usa **en memoria** durante el cálculo de disponibles para planificaciones sucesivas.

---

## 3. Backend

### 3.1 Nuevo módulo: `TrayectoriaModule`

Archivos a crear:

| Archivo | Propósito |
|---|---|
| `backend/src/modules/trayectoria/trayectoria.module.ts` | Module definition, importa TypeOrmFeature para `Trayectoria`, `PeriodoPlanificacion`, `UsuarioCarrera` |
| `backend/src/modules/trayectoria/trayectoria.controller.ts` | CRUD endpoints |
| `backend/src/modules/trayectoria/trayectoria.service.ts` | Lógica de negocio |
| `backend/src/modules/trayectoria/entities/trayectoria.entity.ts` | Entity TypeORM |
| `backend/src/modules/trayectoria/dto/crear-trayectoria.dto.ts` | `{ usuarioCarreraId, nombre }` |
| `backend/src/modules/trayectoria/dto/actualizar-trayectoria.dto.ts` | `{ nombre? }` |

#### Endpoints del controlador

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/trayectorias?usuarioCarreraId=:id` | Listar trayectorias de una inscripción |
| `POST` | `/trayectorias` | Crear trayectoria |
| `PATCH` | `/trayectorias/:id` | Renombrar trayectoria |
| `DELETE` | `/trayectorias/:id` | Eliminar trayectoria + todas sus planificaciones en cascada |
| `GET` | `/trayectorias/:id/planificaciones` | Listar planificaciones de la trayectoria ordenadas por año, instancia |

### 3.2 Modificaciones en `PlanificacionService`

#### 3.2.1 `crearPeriodo()` modificado

El `CrearPeriodoDto` se extiende con:
```
trayectoriaId?: number    // si se especifica, la planificación se crea dentro de la trayectoria
planificacionOrigenId?: number   // id de la planificación anterior en la cadena
```

Validaciones adicionales:
- Si `trayectoriaId` está presente, validar que `usuarioCarreraId` coincida con el de la trayectoria.
- Si `planificacionOrigenId` está presente, validar que pertenezca a la misma trayectoria.
- Si `trayectoriaId` está presente, validar orden cronológico: `(anio, instancia)` debe ser posterior a la última planificación existente en la trayectoria.
- Una planificación suelta (`trayectoriaId = NULL`) no puede tener `planificacionOrigenId`.

#### 3.2.2 `obtenerMateriasDisponibles()` para planificación sucesiva

Nuevo parámetro opcional `trayectoriaId?: number`. Cuando se especifica:

1. Obtener las materias normalmente disponibles (correlativas ya cumplidas en BD).
2. Si `periodoId` también está presente:
   - Obtener TODAS las planificaciones de la trayectoria.
   - Construir un `Map<periodoId, PeriodoPlanificacion>` para lookup rápido.
   - Recorrer la **cadena de ancestros** del período actual vía `planificacionOrigenId`:
     - Por cada ancestro, agregar sus materias a `idsPlanificadasEnTrayectoria` (excluyen de disponibles) y a `idsPlanificadasPrevias` (considerarlas cumplidas para correlativas).
   - Las materias en forks hermanos (misma posición cronológica, distinto `planificacionOrigenId`) **no se excluyen** de disponibles.
3. Filtrar materias: excluir las que estén en `idsPlanificadasEnTrayectoria`, mantener las que solo estén en `idsPlanificadasPrevias` (desbloqueadas por planificaciones previas).
4. Calcular correlativas como si las materias en `idsPlanificadasPrevias` estuvieran completadas (en memoria).
5. Unir ambos conjuntos: disponibles actuales + las que se desbloquean con las planificaciones anteriores.

**Endpoint existente modificado:**
```
GET /planificacion/disponibles?usuarioCarreraId=:id&trayectoriaId=:tid&periodoId=:pid
```

- `trayectoriaId`: opcional. Si presente, se calculan disponibles sucesivos.
- `periodoId`: obligatorio si `trayectoriaId` está presente. Es el periodo actual que se está editando. Se recorren los ancestros vía `planificacionOrigenId` para filtrar/excluir materias planificadas y considerar las previas para correlativas.

#### 3.2.3 `obtenerMateriasDesbloqueables()` modificado

Cuando se consulta desde una planificación dentro de una trayectoria:
- Incluir en la base de correlativas cumplidas tanto las materias completadas reales como las planificadas en periodos anteriores de la misma trayectoria.

#### 3.2.4 Nuevo endpoint: árbol de bifurcaciones

```
GET /trayectorias/:id/arbol
```

Devuelve la estructura de la trayectoria como un árbol JSON:

```typescript
interface NodoTrayectoria {
  periodo: PeriodoPlanificacion;
  hijos: NodoTrayectoria[];  // continuaciones (bifurcaciones)
}
```

Esto permite al frontend renderizar un grafo de las distintas ramas.

### 3.3 Entidad modificada: `PeriodoPlanificacion`

```typescript
// Nuevas columnas
@ManyToOne(() => Trayectoria, { nullable: true })
@JoinColumn({ name: 'trayectoria_id' })
trayectoria?: Trayectoria;

@Column({ name: 'trayectoria_id', nullable: true })
trayectoriaId?: number;

@ManyToOne(() => PeriodoPlanificacion, { nullable: true })
@JoinColumn({ name: 'planificacion_origen_id' })
planificacionOrigen?: PeriodoPlanificacion;

@Column({ name: 'planificacion_origen_id', nullable: true })
planificacionOrigenId?: number;

// Relación inversa: hijos
@OneToMany(() => PeriodoPlanificacion, pp => pp.planificacionOrigen)
continuaciones: PeriodoPlanificacion[];
```

---

## 4. Frontend

### 4.1 Nueva página/ruta: Listado de trayectorias

Ruta: `/trayectorias`
Componente: `TrayectoriasPage`

MUestra todas las trayectorias de la carrera activa como cards. Cada card tiene:
- Nombre de la trayectoria
- Cantidad de planificaciones que contiene
- Botón "Ver trayectoria"
- Botón "Nueva planificación sucesiva"

### 4.2 Nueva página/ruta: Detalle de trayectoria

Ruta: `/trayectoria/:id`
Componente: `TrayectoriaPage`

Muestra:
- Nombre de la trayectoria
- Línea de tiempo con las planificaciones ordenadas cronológicamente
- Visualización de bifurcaciones (pestañas o árbol colapsable)
- Cada planificación en la línea de tiempo se puede clickear para ir a la vista de edición
- Botón "Continuar planificación" para crear la siguiente en la cadena

### 4.3 Modificaciones en `NuevoPeriodoModal`

Agregar:
- Checkbox/select: "¿Pertenece a una trayectoria?"
- Si se marca, mostrar selector de trayectoria existente o botón "Crear nueva trayectoria"
- Selector de "Planificación origen" (solo las que no tengan ya continuaciones o permitiendo múltiples hijos)

### 4.4 Modificaciones en `PlanificacionPage`

Cuando la planificación pertenece a una trayectoria:
- Mostrar indicador "Trayectoria: {nombre}" en el header
- Mostrar breadcrumb de navegación: Trayectorias → {nombre} → {periodo actual}
- Las materias disponibles cargan con `trayectoriaId` y `periodoId` usando el endpoint modificado
- Botón "Crear siguiente" que navega a crear una nueva planificación sucesiva con esta como origen
- Indicador visual de si es una bifurcación (rama secundaria)

### 4.5 Nuevo componente: `ArbolTrayectoria`

Renderiza el árbol de bifurcaciones usando la respuesta de `GET /trayectorias/:id/arbol`.

- Cada nodo es una card con info de la planificación.
- Las flechas conectan nodos padre → hijos.
- Usar una librería ligera de grafo (dagre, react-flow) o CSS grid manual si el árbol es simple.

### 4.6 Tipos nuevos (`planificacion.types.ts`)

```typescript
interface Trayectoria {
  trayectoriaId: number;
  usuarioCarreraId: number;
  nombre: string;
  creadoEn: string;
  planificaciones: PeriodoPlanificacion[];
}

interface CrearTrayectoriaDto {
  usuarioCarreraId: number;
  nombre: string;
}

interface NodoTrayectoria {
  periodo: PeriodoPlanificacion;
  hijos: NodoTrayectoria[];
}

// Extensión de CrearPeriodoDto
interface CrearPeriodoSucesivoDto extends CrearPeriodoDto {
  trayectoriaId?: number;
  planificacionOrigenId?: number;
}
```

### 4.7 Nuevo store: `trayectoria.store.ts` (zustand)

```typescript
interface TrayectoriaStore {
  trayectoriaActiva: Trayectoria | null;
  arbol: NodoTrayectoria | null;
  // acciones
  setTrayectoriaActiva: (t: Trayectoria | null) => void;
  setArbol: (n: NodoTrayectoria | null) => void;
  limpiar: () => void;
}
```

### 4.8 Nuevo hook: `useTrayectoria.ts`

Similar a `usePlanificacion.ts` pero para trayectorias. Usa React Query para:
- `['trayectorias', usuarioCarreraId]` → lista
- `['trayectoria', trayectoriaId]` → detalle con planificaciones
- `['trayectoria-arbol', trayectoriaId]` → árbol

### 4.9 Modificaciones en el servicio `planificacion.service.ts`

Nuevos métodos:
```typescript
// Trayectorias
listarTrayectorias(usuarioCarreraId: number): Promise<Trayectoria[]>
crearTrayectoria(data: CrearTrayectoriaDto): Promise<Trayectoria>
actualizarTrayectoria(id: number, data: ActualizarTrayectoriaDto): Promise<Trayectoria>
eliminarTrayectoria(id: number): Promise<void>
obtenerArbolTrayectoria(id: number): Promise<NodoTrayectoria>

// Periodos con trayectoria
crearPeriodoSucesivo(data: CrearPeriodoSucesivoDto): Promise<PeriodoPlanificacion>
```

Modificaciones:
```
obtenerMateriasDisponibles(usuarioCarreraId, trayectoriaId?, periodoId?): Promise<MateriaEnCelda[]>
```

### 4.10 Routing

```typescript
// Nuevas rutas
'/trayectorias' → TrayectoriasPage
'/trayectoria/:id' → TrayectoriaPage

// La ruta existente /planificacion/:id se mantiene igual
// pero si la planificación tiene trayectoriaId, muestra info de trayectoria
```

---

## 5. Lógica de negocio detallada

### 5.1 Cálculo de materias disponibles en una planificación sucesiva

Dada una trayectoria `T` y una planificación `P_actual` dentro de ella:

1. `completadas_reales` ← materias con `estado_materia_id = 3` (Completada) en `progreso_materia` para el `usuario_carrera_id`.
2. `ancestros` ← periodos en la **cadena de ancestros** de `P_actual` recorriendo `planificacionOrigenId` hasta la raíz.
3. `planificadas_previas` ← todos los `materia_id` únicos de `materia_planificada` en `ancestros`.
4. `ids_cumplidos` ← `completadas_reales ∪ planificadas_previas`.
5. Para cada materia `M` del plan de estudios de la carrera:
   - Si `M` está en `completadas_reales` **o** en `planificadas_previas` → excluir (ya fue planificada).
   - Obtener correlativas de `M`.
   - Si todas las correlativas están en `ids_cumplidos` → incluir como disponible.
6. El resultado es la unión de: disponibles actuales (correlativas reales cumplidas) + materias que se desbloquean gracias a las planificaciones previas.

> **Importante:** Solo se recorren los **ancestros**, no todos los periodos de la trayectoria. Esto asegura que en bifurcaciones (A → {B, C}), las materias planificadas en B no se excluyan de las disponibles en C, y viceversa. Cada fork tiene su propia línea temporal independiente.

### 5.2 Validación de orden cronológico

El orden de instancias dentro de un mismo año debe ser:
`Verano < 1er Cuatrimestre < 2do Cuatrimestre`

Para validar, al crear una planificación en una trayectoria:
- Obtener la última planificación en la trayectoria (ordenada por año DESC, instancia según orden definido).
- Si `(nuevo_anio, nueva_instancia) <= (ultimo_anio, ultima_instancia)` → rechazar.
- Si `planificacionOrigenId` se especifica, verificar que sea la última o que apunte a un nodo hoja.

### 5.3 Reglas de bifurcación

- Una planificación puede tener **N** hijos (continuaciones), siempre que cada hijo tenga `(anio, instancia)` posterior.
- El campo `nombre` de `PeriodoPlanificacion` se usa para distinguir bifurcaciones (ej: "RPA", "IA", "Mixta").
- Al listar continuaciones de una planificación, se muestran agrupadas por rama.
- No se permite que dos hijos tengan el mismo `(anio, instancia, nombre)` dentro de la misma trayectoria.

### 5.4 Eliminación en cascada de nodos

`planificacion_origen_id` NO tiene `ON DELETE CASCADE`. El borrado de descendientes se maneja manualmente
en el servicio `PlanificacionService.eliminarPeriodo()` mediante el método privado `eliminarDescendientes`,
que recorre recursivamente todas las continuaciones y las elimina junto con sus materias planificadas.

**Ejemplo:** Dado el árbol:
```
A ──┬── B1 ── C1
    └── B2 ── C2
```

| Acción | Resultado |
|---|---|
| Eliminar C1 | Solo C1 |
| Eliminar B1 | B1 + C1 (recursivo sobre continuaciones de B1) |
| Eliminar A | A + B1 + C1 + B2 + C2 (recursivo sobre continuaciones de A y sus descendientes) |

> **IMPORTANTE:** La FK `trayectoria_id → trayectoria` SÍ tiene `ON DELETE CASCADE`, por lo que al eliminar una trayectoria se borran todas sus planificaciones (ejecutando los hooks de eliminación de TypeORM).

### 5.5 Efectos al completar materias reales

Cuando el usuario realmente completa una materia (progreso → Completada), esta deja de aparecer como "planificada" en las trayectorias y pasa a ser "completada real". El cálculo de disponibles sucesivos debe priorizar `completadas_reales` sobre `planificadas_previas` (aunque en la práctica es irrelevante porque la unión es la misma).

### 5.6 Validación al editar una planificación con hijos — ⏳ NO IMPLEMENTADO (frontend)

> **Estado actual:** El backend tiene la lógica completa (`obtenerImpactoEliminacion`, `eliminarMateriaPlanificada` con `modo: 'simple' | 'cascade'`, `verificarInconsistencias`, `eliminarRecursivo`). El frontend **no tiene** el modal de impacto ni laUI para elegir modo de eliminación. Al guardar, se llama `eliminarMateriaPlanificada(id)` sin `modo` (default `simple`).

Cuando se edita una planificación que tiene continuaciones (hijos), las acciones sobre sus materias planificadas pueden romper la cadena de correlativas de los planes sucesores. Se definen tres reglas según el estado de la materia y la decisión del usuario:

#### 5.6.1 Materia completada real — inamovible

Si una materia planificada tiene `estado_materia_id = 3` (Completada) en `progreso_materia`:

- **No se puede eliminar** del plan.
- **No se puede mover** a otro bloque horario ni día.
- Se muestra visualmente como bloqueada (opaca, con badge "Completada", sin botón de quitar ni capacidad drag).
- **Fundamento:** el plan funciona como registro histórico de qué se cursó y en qué horario.

#### 5.6.2 Materia no completada — eliminación simple

Si una materia NO está completada y el usuario elige "Eliminar sin afectar hijos":

1. Se elimina la materia del plan actual.
2. No se modifica ningún plan hijo.
3. En cada plan hijo donde exista una materia cuya correlativa dependa de la eliminada, esa materia se marca como **inconsistente** (⚠️).
4. Una materia inconsistente:
   - Sigue visible en el plan hijo (el registro se conserva).
   - Muestra un tooltip: *"Correlativa '{nombre}' ya no está planificada en '{plan}'"*.
   - La inconsistencia se resuelve **automáticamente** si la materia ausente se completa realmente en el futuro (al recalcular disponibles, pasa a estar en `completadas_reales`).

#### 5.6.3 Materia no completada — eliminación en cascada

Si una materia NO está completada y el usuario elige "Eliminar en cascada":

1. Se elimina la materia del plan actual.
2. Se identifican **todas** las materias en planes hijos que dependan directa o indirectamente de ella (a través de la cadena de correlativas).
3. Se eliminan también esas materias de los planes hijos (recursivamente en toda la subrama).
4. No quedan marcas de inconsistencia porque los elementos problemáticos se eliminan.

#### 5.6.4 Modal de análisis de impacto — ⏳ NO IMPLEMENTADO

Al intentar eliminar una materia no completada de un plan que tenga hijos, se muestra un modal con la siguiente estructura:

```
"Estás por sacar '{nombre_materia}' del plan '{plan_actual}'."

[Lista de materias afectadas en planes sucesores:]
• Plan '{plan_hijo_1}': {nombre_materia_1}
• Plan '{plan_hijo_2}': {nombre_materia_2}

"¿Qué querés hacer?"

[Cancelar]  [Eliminar solo '{nombre_materia}' (materias hijas quedarán ⚠️)]  [Eliminar en cascada (se eliminan también las materias hijas)]
```

- **Opción 1** por defecto si hay materias afectadas. Cancela la operación.
- **Opción 2** preseleccionada. Aplica la regla 5.6.2.
- **Opción 3** aplica la regla 5.6.3.

#### 5.6.5 Resumen de comportamientos

| Estado de la materia editada | ¿Se puede eliminar? | ¿Se puede mover? | Efecto en planes hijos |
|---|---|---|---|
| Completada real | No | No | Sin efecto |
| No completada → "Eliminar simple" | Sí | Sí | Materias dependientes marcadas ⚠️ |
| No completada → "Eliminar cascada" | Sí | Sí | Materias dependientes eliminadas |

---

## 6. Migración de base de datos

### 6.1 Crear tabla `trayectoria`

```sql
CREATE TABLE trayectoria (
    trayectoria_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_carrera_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_trayectoria_usuario_nombre (usuario_carrera_id, nombre),
    CONSTRAINT fk_trayectoria_usuario_carrera
        FOREIGN KEY (usuario_carrera_id) REFERENCES usuario_carrera(usuario_carrera_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 6.2 Modificar `periodo_planificacion`

```sql
ALTER TABLE periodo_planificacion
    ADD COLUMN trayectoria_id INT NULL AFTER usuario_carrera_id,
    ADD COLUMN planificacion_origen_id INT NULL AFTER nombre,
    ADD INDEX idx_periodo_trayectoria (trayectoria_id),
    ADD INDEX idx_periodo_origen (planificacion_origen_id),
    ADD CONSTRAINT fk_periodo_trayectoria
        FOREIGN KEY (trayectoria_id) REFERENCES trayectoria(trayectoria_id)
        ON DELETE CASCADE,
    ADD CONSTRAINT fk_periodo_origen
        FOREIGN KEY (planificacion_origen_id) REFERENCES periodo_planificacion(periodo_id)
        ON DELETE CASCADE;
```

---

## 7. Orden de implementación sugerido

| Paso | Descripción | Archivos |
|---|---|---|
| 1 | Migración BD: crear `trayectoria`, alterar `periodo_planificacion` | migration SQL / TypeORM |
| 2 | Entidad `Trayectoria` + modificar `PeriodoPlanificacion` entity | backend entities |
| 3 | DTOs de trayectoria | `crear-trayectoria.dto.ts`, `actualizar-trayectoria.dto.ts` |
| 4 | Servicio y controlador de trayectoria | `trayectoria.service.ts`, `trayectoria.controller.ts` |
| 5 | Modificar `CrearPeriodoDto` y `PlanificacionService.crearPeriodo()` | dto + service |
| 6 | Modificar `obtenerMateriasDisponibles()` con soporte trayectoria | `planificacion.service.ts` |
| 7 | Endpoint árbol de bifurcaciones | `trayectoria.controller.ts` + service |
| 8 | Tipos frontend + service methods | `planificacion.types.ts`, `planificacion.service.ts` |
| 9 | Store trayectoria + hook | `trayectoria.store.ts`, `useTrayectoria.ts` |
| 10 | Página `TrayectoriasPage` | `/trayectorias` |
| 11 | Página `TrayectoriaPage` con timeline/árbol | `/trayectoria/:id` |
| 12 | Modificar `NuevoPeriodoModal` con selector de trayectoria | modal |
| 13 | Modificar `PlanificacionPage` para contexto de trayectoria | page |
| 14 | Componente `ArbolTrayectoria` | componente |

---

## 8. Notas adicionales

- El comportamiento actual (planificaciones sueltas, sin trayectoria) debe seguir funcionando sin cambios. `trayectoria_id = NULL` mantiene compatibilidad total.
- Las planificaciones dentro de una trayectoria se pueden eliminar individualmente. El servicio ejecuta `eliminarDescendientes` recursivamente para eliminar toda la subrama. Ver sección 5.4.
- Considerar agregar validación temprana en el frontend: al crear una planificación sucesiva, el backend debe rechazar si el orden cronológico no es válido.
- Las materias disponibles en modo sucesivo se calculan en el backend; el frontend solo muestra la lista que recibe. No hay lógica adicional del lado del cliente para este cálculo.

---

## 9. Diferencias con la implementación real

| Aspecto | Documentado | Real |
|---|---|---|
| Filtro de planificaciones independientes | No especificado | `listarPeriodos`/`listarPeriodosPaginado` aceptan `independientes?: boolean`. Usan `IsNull()` de TypeORM (no `null` literal). |
| Validación de fork | `planificacionOrigenId` debe apuntar al último nodo | Solo verifica que el nuevo período sea posterior al origen. Permite bifurcaciones aunque existan otros períodos en la misma posición cronológica. |
| Botón volver en PlanificacionPage | Navega a `/planificaciones` o `/trayectoria/:id` | Usa `navigate(-1)` para siempre ir a la página anterior. |
| Redirect al cambiar carrera en TrayectoriaPage | No especificado | `useEffect` observa `trayectoriasList` y redirige a `/trayectorias` si la trayectoria actual no pertenece a la nueva carrera. |
| Invalidation de trayectorias al crear período | Solo `['trayectoria', id]` y `['trayectoria-arbol', id]` | También invalida `['trayectorias', usuarioCarreraId]` para refrescar el contador en la lista. |
| Invalidation de trayectorias al eliminar período | Solo `['planificacion']` | Invalida `['trayectoria']`, `['trayectorias']` y `['planificacion']` antes de `navigate(-1)`. |
| Navegación post-eliminación | Hard-coded a `/planificaciones` o `/trayectoria/:id` | `navigate(-1)` para volver a la página anterior. |
| Backend 404 en materias/materias-desbloqueables | `NotFoundException` | Retorna `[]` si el período no existe, evitando errores por race conditions. |
| Chips de contador | No especificado | CarrerasPage, CarreraDetailPage (años, cuatrimestres), PlanEstudiosAdmin, MateriaCorrelativasAdmin usan chips neon-cyan `px-2.5 py-0.5 rounded-full`. |
| Estado `Planificado` (id=4) | Se menciona como necesario | No implementado. El cálculo de disponibles trayectoria se hace consultando `materia_planificada` de periodos previos, sin persistir estado adicional. |
| Eliminación en cascada de periodos | `ON DELETE CASCADE` en `planificacion_origen_id` | Se maneja manualmente vía `eliminarDescendientes` en `planificacion.service.ts`. La FK usa `ON DELETE SET NULL` (definido en la entity como `onDelete: 'SET NULL'`). |
| Validación de correlativas al planificar | Llama a `validarCorrelativas` internamente | `planificarMateria` ahora usa `obtenerMateriasDisponibles` para validar (misma lógica que el listado del frontend), garantizando consistencia absoluta entre lo que se muestra y lo que se acepta. |
| Cálculo de materias disponibles en forks | Consideraba todos los periodos de la trayectoria planos | Usa **cadena de ancestros** vía `planificacionOrigenId`. Cada fork es independiente: materias en B no afectan disponibles en C. Aplica también en `obtenerMateriasDesbloqueables`. |
| Botón "+ Nueva planificación" en TrayectoriaPage | Presente | Eliminado. Solo se crean periodos como continuación de otro (botón "Continuar") o como el primero (EmptyState). |
| Invalidación de árbol al eliminar periodo | Solo `['trayectoria']`, `['trayectorias']`, `['planificacion']` | Se agregó `['trayectoria-arbol']` para refrescar el árbol de bifurcaciones. |
| Relación `materia` en query de progresos para `validarCorrelativas` | No se cargaba explícitamente | Se agregó `materia: true` en las relations de la query de progresos. |
| Método `eliminarPeriodo` | Solo eliminaba materias planificadas y el periodo | Ahora antes de eliminar ejecuta `eliminarDescendientes` para eliminar recursivamente todos los hijos y sus materias. |
| `obtenerPlanificadasPrevias` | Escaneo plano cronológico de todos los periodos | Usa **cadena de ancestros** vía `planificacionOrigenId` (consistente con `obtenerMateriasDisponibles`). |
| Sección 5.6 (validación al editar con hijos) | Documentado como implementado | Backend: implementado. Frontend: **NO implementado** (falta modal de impacto, selector simple/cascade, materias bloqueadas). |
