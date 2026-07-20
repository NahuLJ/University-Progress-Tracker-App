# Página Plan de Estudios — Especificación Técnica (implementada)

> **Estado de implementación:** ✅ Completa. `CarrerasPage` delega a `components/carrera/CarrerasPage`,
> que lista las inscripciones del usuario (activas e inactivas) y las carreras disponibles del catálogo.
> Cada `CarreraCard` solo tiene el botón **Ver plan de estudios** que navega a `/carreras/:id`.
> Las acciones de inscripción/desinscripción/eliminación están en `CarreraDetailPage`.
> `CarreraDetailPage` muestra el plan vía `usePlanEstudios`. El progreso del usuario (estado, nota, tipo)
> se mergea por la **inscripción de la carrera que está en la URL**, no por la carrera activa del navbar.
> Vista árbol/tabla: el toggle está **entre** la card de info de la carrera y la card "Plan de estudios"
> (alineado a la derecha). En vista árbol, la card "Plan de estudios" tiene en su header los botones
> **Expandir todo / Contraer todo**. Abre `MateriaDetailModal` (info + `CorrelativasList`) al click en
> una materia. **Las correlativas ahora muestran su estado real (Pendiente/En Proceso/Completada) con nota y tipo si corresponde**. Sin datos mockeados. Snackbar global para notificaciones de éxito/error.

## Estructura de Componentes (real)

```
pages/
├── CarrerasPage.tsx            # delega a components/carrera/CarrerasPage
└── CarreraDetailPage.tsx       # plan de estudios de una carrera (árbol/tabla)

components/carrera/
├── CarrerasPage.tsx            # lista inscripciones activas/inactivas + disponibles; solo "Ver plan de estudios"
├── CarreraCard.tsx             # card con badge Inscripto/Desinscripto + botón "Ver plan de estudios"
├── PlanEstudiosTree.tsx        # árbol Año → Cuatrimestre → Materia (usa Accordion)
├── MateriaDetailModal.tsx      # detalle de materia + CorrelativasList
├── CorrelativasList.tsx        # correlativas y "es correlativa de"
├── InscribirCarreraModal.tsx   # formulario de inscripción (carreras disponibles reales)
└── DesinscribirCarreraModal.tsx# modal de confirmación simple para desinscribirse

components/ui/
├── Card.tsx · Modal.tsx · Badge.tsx · Accordion.tsx · Button.tsx · Input.tsx · Select.tsx · Skeleton.tsx
├── Snackbar.tsx                # notificaciones flotantes globales

components/layout/
└── CarreraSelector.tsx         # selector de carrera activa en sidebar

hooks/
├── useCarreras.ts              # useCarreras() + useInscribirCarrera() + useDesinscribirCarrera()
│                               #   + useReactivarCarrera() + useEliminarCarreraDefinitivamente()
│                               #   + useCarreraActiva()
└── usePlanEstudios.ts          # useQuery del plan de una carrera

services/carreras.service.ts    # obtenerCarrerasDelUsuario, obtenerCarrerasActivasDelUsuario,
                                # obtenerCarrerasDisponibles, obtenerPlanEstudios,
                                # inscribirCarrera, desinscribirCarrera, reactivarCarrera,
                                # eliminarCarreraDefinitivamente

store/
├── auth.store.ts               # sesión del usuario
├── sidebar.store.ts            # colapso del sidebar
├── carrera.store.ts            # carrera activa seleccionada (se resetea al desinscribir/eliminar)
├── planificacion.store.ts      # planificación en edición
└── notification.store.ts       # notificaciones del snackbar
```

> **Estado:** Las cards en `CarrerasPage` solo tienen el botón "Ver plan de estudios".
> Las inactivas (soft delete) muestran badge "Desinscripto" pero sin botones de acción.
> En `CarreraDetailPage`, si el usuario está inscripto se muestran dos botones:
> "Desinscribirse" (abre `DesinscribirCarreraModal` simplificado, sin escribir texto) y
> "Eliminar" (hard delete con confirmación). Si está desinscripto: "Volver a inscribirse"
> (con modal de confirmación) y "Eliminar definitivamente". Toda acción muestra notificación
> snackbar con resultado. Al desinscribir/eliminar, la carrera activa del store se resetea
> a la primera disponible o null.
> El progreso mostrado en el plan de estudios corresponde a la **inscripción de la carrera que está en
> la URL** (`inscripcionActual.usuarioCarreraId`), no a la carrera activa seleccionada en el navbar,
> de modo que el detalle de cada carrera muestra siempre su propio progreso.

### Árbol de Composición

```
Ruta /carreras
└── CarrerasPage (componente)
    ├── Header "Carreras"
    ├── Mis carreras
    │   ├── Activas → CarreraCard (badge "Inscripto" + "Ver plan de estudios")
    │   └── Desinscriptas → CarreraCard (badge "Desinscripto" + "Ver plan de estudios")
    └── Carreras disponibles → CarreraCard (solo "Ver plan de estudios")

 Ruta /carreras/:id
└── CarreraDetailPage
    ├── Header: nombre + descripción + badge Inscripto/Desinscripto
    │   ├── Si inscripto: "Desinscribirse" + "Eliminar" (abre modales)
    │   ├── Si desinscripto: "Volver a inscribirse" + "Eliminar definitivamente"
    │   └── Si no inscripto: "Inscribirse a esta carrera"
    ├── Toggle Vista árbol / Vista tabla (entre cards, alineado a la derecha)
    ├── Plan de estudios (card con título + botones Expandir todo / Contraer todo en el header, solo vista árbol)
    │   ├── Vista árbol: Accordion Año → Cuatrimestre → MateriaRow (con StatusBadge)
    │   └── Vista tabla: columnas centradas Nro | Código | Materia | Año | Cuatrimestre | Créditos | Estado
    ├── InscribirCarreraModal
    ├── DesinscribirCarreraModal (confirmación simple)
    ├── Modal hard delete + Modal reactivar
    └── MateriaDetailModal

Global
└── Snackbar (notificaciones success/error/info con auto-dismiss)
```

---

## Manejo del Estado Local

### `useCarreras` (`hooks/useCarreras.ts`)

```typescript
export function useCarreras() {
    const usuario = useAuthStore((s) => s.usuario);
    return useQuery({
        queryKey: ['carreras', usuario?.id],
        queryFn: () => carrerasService.obtenerCarrerasDelUsuario(usuario!.id),
        enabled: !!usuario,
    });
}

export function useInscribirCarrera() {
    const queryClient = useQueryClient();
    const usuario = useAuthStore((s) => s.usuario);
    return useMutation({
        mutationFn: (data: InscribirCarreraDto) => carrerasService.inscribirCarrera(usuario!.id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['carreras', usuario!.id] }),
    });
}
```

### `usePlanEstudios` (`hooks/usePlanEstudios.ts`)

```typescript
export function usePlanEstudios(carreraId: number | undefined, usuarioCarreraId?: number | null) {
    return useQuery({
        queryKey: ['plan-estudios', carreraId, usuarioCarreraId],
        queryFn: () => carrerasService.obtenerPlanEstudios(carreraId!, usuarioCarreraId),
        enabled: !!carreraId,
    });
}
```

---

## Comportamiento UX/UI

### PlanEstudiosTree — Árbol de Materias

Usa `Accordion` anidados (controlados vía props `open`/`onOpenChange`): `AnioAccordion`
(1° Año, 2° Año, …) → `CuatrimestreAccordion` (1° Cuatrimestre, …) → `MateriaRow`. Cada materia
muestra orden, nombre, código y créditos, y un `StatusBadge` con el estado del usuario
(`estadoUsuario` como string directo). El componente recibe `expandirSignal` / `contraerSignal`
(números) que disparan expandir/contraer todo vía `useEffect`. Click en una materia abre
`MateriaDetailModal`. Los botones "Expandir todo / Contraer todo" viven en el header de la card
"Plan de estudios" (en `CarreraDetailPage`), no dentro del árbol.

### MateriaDetailModal — Detalle de Materia

Muestra código, créditos, carga horaria, `StatusBadge` con el texto del estado (ej: "Pendiente",
"Completada (Nota: 7) (Final)"), descripción y `CorrelativasList`. `CorrelativasList` renderiza dos
secciones: "Correlativas (para cursar esta materia)" y "Es correlativa de", cada una con
`StatusBadge` que muestra el **estado real del usuario** para esa materia correlativa (Pendiente /
En Proceso / Completada con nota y tipo de aprobación). El backend ahora devuelve `estadoUsuario`,
`nota` y `tipoAprobacion` para cada correlativa en `GET /carreras/:id/plan-estudios`.

### InscribirCarreraModal

Formulario RHF + Zod (`carreraId`, `fechaInicio`). El `Select` de carrera se llena con las carreras
disponibles reales vía `carrerasService.obtenerCarrerasDisponibles()` (filtra las ya inscriptas). El
`onSubmit` invoca `useInscribirCarrera` (POST `/usuarios/:id/carreras`), invalida la query de carreras y
cierra el modal.

### Interacciones

| Acción | Comportamiento |
|---|---|
| Click en materia (árbol o tabla) | Abre `MateriaDetailModal` con info + correlativas |
| Click "Inscribirse" | Abre `InscribirCarreraModal` → POST + invalidar queries + snackbar success |
| Click "Desinscribirse" (detail) | Abre `DesinscribirCarreraModal` (confirmación simple) → DELETE + snackbar + reset store |
| Click "Eliminar" (detail) | Abre modal de confirmación hard delete → DELETE definitivo + snackbar + reset store |
| Click "Volver a inscribirse" | Abre modal de confirmación → PATCH reactivar + snackbar |
| Cambio árbol/tabla | Switch visual (toggle entre cards, a la derecha) |
| Expandir/Contraer todo | Botones en el header de "Plan de estudios" (solo vista árbol) |
| Columnas tabla | Centradas (tanto header como datos) |

### Estados

| Estado | Comportamiento |
|---|---|
| Cargando | `Skeleton` con la estructura de tarjetas/acordeones |
| Carrera sin materias | `EmptyState` / mensaje en la vista |
| Usuario sin carreras | Mensaje "Aún no estás inscripto" en la sección Mis carreras |
| Error en mutación | Snackbar tipo `error` con mensaje descriptivo |
| Éxito en mutación | Snackbar tipo `success` (3s auto-dismiss) |

> **Gestión de catálogo (admin):** crear carreras, crear materias en el catálogo global y
> asignar correlativas se especifica en `docs/backend/admin-carreras-materias-module.md`.
> La UI de administración ya está implementada en `/admin` (tabs Carreras / Materias / Plan / Correlativas).
