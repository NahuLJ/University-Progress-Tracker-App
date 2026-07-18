# Página Plan de Estudios — Especificación Técnica (implementada)

> **Estado de implementación:** ✅ Completa. `CarrerasPage` delega a `components/carrera/CarrerasPage`,
> que **siempre lista TODAS las carreras disponibles** (catálogo) y, combinando con las inscripciones del
> usuario, muestra en cada `CarreraCard` el botón **Inscribirse** (si no está inscripto) o **Desinscribirse**
> (si lo está) vía `useInscribirCarrera`/`useDesinscribirCarrera`. `CarreraDetailPage` muestra el plan vía
> `usePlanEstudios` (vista árbol/tabla) y abre `MateriaDetailModal` (info + `CorrelativasList`) al click en
> una materia. Sin datos mockeados. La gestión de catálogo (crear carreras/materias/correlativas) vive en `/admin`.

## Estructura de Componentes (real)

```
pages/
├── CarrerasPage.tsx            # delega a components/carrera/CarrerasPage
└── CarreraDetailPage.tsx       # plan de estudios de una carrera (árbol/tabla)

components/carrera/
├── CarrerasPage.tsx            # lista TODAS las carreras; cada card con botón Inscribirse/Desinscribirse
├── PlanEstudiosTree.tsx        # árbol Año → Cuatrimestre → Materia (usa Accordion)
├── MateriaDetailModal.tsx      # detalle de materia + CorrelativasList
├── CorrelativasList.tsx        # correlativas y "es correlativa de"
└── InscribirCarreraModal.tsx   # formulario de inscripción (carreras disponibles reales)

components/ui/
├── Card.tsx · Modal.tsx · Badge.tsx · Accordion.tsx · Button.tsx · Input.tsx · Select.tsx · Skeleton.tsx

hooks/
├── useCarreras.ts              # useCarreras() + useInscribirCarrera()
└── usePlanEstudios.ts          # useQuery del plan de una carrera

services/carreras.service.ts    # obtenerCarrerasDelUsuario, obtenerCarrerasDisponibles,
                                # obtenerPlanEstudios, inscribirCarrera, desinscribirCarrera
```

> **Estado:** `InscribirCarreraModal` obtiene las carreras disponibles con
> `carrerasService.obtenerCarrerasDisponibles()` (filtra las ya inscriptas) e invoca `useInscribirCarrera`
> para crear la inscripción. El botón "Desinscribirse" en `CarrerasPage` usa `useDesinscribirCarrera`
> (con `confirm()` de confirmación). `MateriaDetailModal` (info + correlativas) ya está cableado: al
> hacer click en una materia en la vista árbol (`PlanEstudiosTree.onMateriaClick`) o en la tabla se abre
> el modal en `CarreraDetailPage`.

### Árbol de Composición

```
Ruta /carreras
└── CarrerasPage (componente)
    ├── Header "Carreras" + conteo de disponibles
    ├── Grid de Card por CADA carrera del catálogo
    │   ├── nombre, descripción, duración, créditos, fecha de inicio (si inscripto)
    │   ├── Badge "Inscripto" cuando aplica
    │   ├── "Ver plan de estudios" → /carreras/:carreraId
    │   ├── "Inscribirse" (si no inscripto) · "Desinscribirse" (si inscripto, usa useDesinscribirCarrera)
    └── (InscribirCarreraModal queda disponible pero la inscripción se hace desde la card)

Ruta /carreras/:id
└── CarreraDetailPage
    ├── Header: nombre + descripción + badge Inscripto + botón Inscribirse
    ├── Toggle Vista árbol / Vista tabla
    ├── PlanEstudiosTree (árbol de Accordions) O tabla plana (año/cuatrimestre/orden/créditos)
    └── InscribirCarreraModal
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
export function usePlanEstudios(carreraId: number | undefined) {
    return useQuery({
        queryKey: ['plan-estudios', carreraId],
        queryFn: () => carrerasService.obtenerPlanEstudios(carreraId!),
        enabled: !!carreraId,
    });
}
```

---

## Comportamiento UX/UI

### PlanEstudiosTree — Árbol de Materias

Usa `Accordion` anidados: `AnioAccordion` (1° Año, 2° Año, …) → `CuatrimestreAccordion`
(1° Cuatrimestre, …) → `MateriaRow`. Cada materia muestra orden, nombre, código y créditos, y un
`Badge` de estado del usuario (`estadoUsuario.nombre`): 🟢 Completada (CP), 🟡 En Proceso (EP),
🔴 Pendiente (PTE). Click en una materia abre `MateriaDetailModal`.

### MateriaDetailModal — Detalle de Materia

Muestra código, créditos, carga horaria, badge de estado (con nota/tipo si aplica), descripción y
`CorrelativasList`. `CorrelativasList` renderiza dos secciones: "Correlativas (para cursar esta materia)"
y "Es correlativa de", cada una con badge de estado de la materia relacionada.

### InscribirCarreraModal

Formulario RHF + Zod (`carreraId`, `fechaInicio`). El `Select` de carrera se llena con las carreras
disponibles reales vía `carrerasService.obtenerCarrerasDisponibles()` (filtra las ya inscriptas). El
`onSubmit` invoca `useInscribirCarrera` (POST `/usuarios/:id/carreras`), invalida la query de carreras y
cierra el modal.

### Interacciones

| Acción | Comportamiento |
|---|---|
| Click en materia | Abre `MateriaDetailModal` con info + correlativas |
| Click "Inscribirse" en una card | Inscribe al usuario vía `useInscribirCarrera` (sin modal) |
| Confirmar inscripción | POST + invalidar query de carreras + refetch + cierra modal |
| Cambio árbol/tabla | Switch visual (la tabla es un `<table>` plano generado en la página) |

### Estados

| Estado | Comportamiento |
|---|---|
| Cargando | `Skeleton` con la estructura de tarjetas/acordeones |
| Carrera sin materias | `EmptyState` / mensaje en la vista |
| Usuario sin carreras | `EmptyState` con CTA a inscripción |

> **Gestión de catálogo (admin):** crear carreras, crear materias en el catálogo global y
> asignar correlativas se especifica en `docs/backend/admin-carreras-materias-module.md`.
> La UI de administración ya está implementada en `/admin` (tabs Carreras / Materias / Plan / Correlativas).
