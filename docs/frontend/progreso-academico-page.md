# Página Progreso Académico — Especificación Técnica (implementada)

> **Estado de implementación:** ✅ Completa. `ProgresoPage` resuelve la carrera activa con
> `useCarreraActiva()`, muestra `CarrerasResumenList` (selector si hay >1), filtros con debounce, grilla
> editable en línea (`MateriaProgresoRow` con RHF + Zod) y `CompletarMateriaModal` para nota/tipo al
> completar. Maneja errores con `QueryError` + reintentar. Consume `GET /progreso?usuarioCarreraId=`
> (corregido para coincidir con el backend). Sin datos mockeados.

## Estructura de Componentes (real)

```
pages/
└── ProgresoPage.tsx            # orquesta filtros + grid (carrera activa vía useCarreraActiva())

components/progreso/
├── ProgresoGrid.tsx            # grilla con header de columnas + lista de filas
├── MateriaProgresoRow.tsx      # fila con RHF + Zod (estado/nota/tipo en línea)
├── Filtros.tsx                 # FiltroEstado + FiltroBusqueda (debounce 300ms)
├── CompletarMateriaModal.tsx   # modal nota+tipo, se abre al guardar "Completada" sin nota/tipo
├── CarrerasResumenList.tsx     # tarjetas por carrera; selector de carrera activa (si >1)
└── index.tsx                   # barrel export

components/ui/
├── Card.tsx · Badge.tsx · Skeleton.tsx · Button.tsx

hooks/
├── useProgreso.ts              # useQuery + useMutation + filtros (estado/búsqueda)
└── useCarrerasResumen.ts       # resumen por carrera (GET /estadisticas/carreras-resumen)

services/progreso.service.ts     # obtenerProgreso (GET /progreso?usuarioCarreraId=),
                                  # actualizarProgreso (PATCH /progreso/:id),
                                  # inicializarProgreso (POST /progreso/inicializar)
```

> **Estado:** `ProgresoPage` resuelve la carrera activa con `useCarreraActiva()` (nombre y
> `usuarioCarreraId` reales; empty state si no hay carreras). Usa `Filtros` (`FiltroEstado`/`FiltroBusqueda`
> con debounce), `CompletarMateriaModal` (al marcar "Completada" sin nota/tipo, la fila lo abre para
> confirmar nota 4–10 y tipo de aprobación antes de guardar) y `CarrerasResumenList` (selector de carrera
> activa cuando hay más de una). Maneja error de la query con `QueryError` + botón reintentar.
> `ProgresoPage` se exporta como `export default` (para el lazy import en `routes/lazy-pages.tsx`).

### Árbol de Composición (objetivo)

```
MainLayout
└── ProgresoPage
    ├── Header "Progreso Académico" + etiqueta de carrera activa
    ├── CarrerasResumenList (si hay >1 carrera: tarjetas + selector de activa)
    ├── Card: Badges de totales (completadas / en proceso / pendientes)
    ├── Barra de filtros: FiltroEstado (pills) + FiltroBusqueda (input debounce)
    └── ProgresoGrid
        └── MateriaProgresoRow (por cada materia filtrada)
```

---

## Manejo del Estado Local — `useProgreso`

```typescript
export function useProgreso(usuarioCarreraId: number | null) {
    const [filtroEstado, setFiltroEstado] = useState('todas');
    const [busqueda, setBusqueda] = useState('');

    const { data: progresos, isLoading } = useQuery({
        queryKey: ['progreso', usuarioCarreraId],
        queryFn: () => progresoService.obtenerProgreso(usuarioCarreraId!),
        enabled: !!usuarioCarreraId,
    });

    const mutation = useMutation({
        mutationFn: ({ id, data }) => progresoService.actualizarProgreso(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['progreso', usuarioCarreraId] });
            queryClient.invalidateQueries({ queryKey: ['estadisticas'] });
        },
    });

    const progresosFiltrados = progresos?.filter((p) =>
        (filtroEstado === 'todas' || p.estado.nombre === filtroEstado) &&
        p.materia.nombre.toLowerCase().includes(busqueda.toLowerCase()),
    );

    const totales = {
        completadas: progresos?.filter(p => p.estado.nombre === 'Completada').length ?? 0,
        enProceso:   progresos?.filter(p => p.estado.nombre === 'En Proceso').length ?? 0,
        pendientes:  progresos?.filter(p => p.estado.nombre === 'Pendiente').length ?? 0,
    };

    return { progresos: progresosFiltrados, totales, filtroEstado, setFiltroEstado,
             busqueda, setBusqueda, actualizar: (id, data) => mutation.mutate({ id, data }),
             isLoading: isLoading || mutation.isPending };
}
```

### Fila Individual — `MateriaProgresoRow`

Cada fila usa su propio `useForm` (RHF + Zod) con el schema:

```typescript
const progresoSchema = z.object({
    estado: z.enum(['Pendiente', 'En Proceso', 'Completada']),
    nota: z.number().min(4).max(10).optional(),
    tipoAprobacion: z.enum(['Final', 'Promocion']).optional(),
}).refine(
    (data) => data.estado !== 'Completada' || (data.nota !== undefined && data.tipoAprobacion !== undefined),
    { message: 'Nota y tipo de aprobación son obligatorios al completar la materia' },
);
```

El botón "Guardar" aparece solo cuando `editando` es true (se activa al cambiar el select de estado).
Al enviar, llama a `onSave(progreso.progresoId, data)`.

---

## Comportamiento UX/UI

### ProgresoGrid — Vista Principal

Header de columnas: Materia | Código | Créditos | Estado | Nota | Tipo | (acción).
Cada `MateriaProgresoRow` muestra nombre, código y créditos; un `<select>` de estado con borde de color
(verde/amarillo/gris) y, si el estado es "Completada", inputs de nota (4–10) y tipo (Final/Promoción).

### Validaciones del Lado del Cliente

| Regla | Comportamiento |
|---|---|
| Estado "Completada" sin nota/tipo | Error Zod en los campos (`errors.nota` / `errors.tipoAprobacion`) |
| Nota fuera de rango (4–10) | `min=4 max=10` + validación Zod |
| Sin cambios | Botón "Guardar" oculto hasta modificar el select de estado |
| Error de correlativas del backend | El backend rechaza; el error se propaga vía React Query |
| Búsqueda | `Filtros.FiltroBusqueda` aplica debounce de 300ms y filtra la grilla (ya cableado en la página) |

### Estados de la Página

| Estado | Comportamiento |
|---|---|
| Cargando | `ProgresoSkeleton`: 10 filas simuladas |
| Sin resultados tras filtrar | `ProgresoGrid` muestra "No hay materias para mostrar" |
| Cambio de carrera | `useProgreso` refetch por `queryKey` (cuando se conecte el selector real) |
