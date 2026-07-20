# Página Progreso Académico — Especificación Técnica (implementada)

> **Estado de implementación:** ✅ Completa. `ProgresoPage` resuelve la carrera activa con
> `useCarreraActiva()`, muestra `CarrerasResumenList` (selector si hay >1), filtros con debounce,
> y vista árbol (`ProgresoTree`) agrupada por año → cuatrimestre. Cada fila usa pencil para abrir
> `EditarProgresoModal` (con validación 4/7 según tipo). **Si la carrera seleccionada está inactiva,
> se muestra un aviso y se ocultan los controles de edición**. Sin datos mockeados.

## Estructura de Componentes (real)

```
pages/
└── ProgresoPage.tsx            # orquesta filtros + vista árbol (carrera activa vía useCarreraActiva())

components/progreso/
├── ProgresoTree.tsx            # árbol Año → Cuatrimestre con header de columnas + filas
├── MateriaProgresoRow.tsx      # fila con chip de estado + pencil (editar modal) + trash (reset)
├── EditarProgresoModal.tsx     # modal para cambiar estado/nota/tipo con validación
├── Filtros.tsx                 # FiltroEstado + FiltroBusqueda (debounce 300ms)
├── CarrerasResumenList.tsx     # tarjetas por carrera; selector de carrera activa (si >1)
└── index.tsx                   # barrel export

components/ui/
├── Card.tsx · Skeleton.tsx · Button.tsx · Accordion.tsx · Icon.tsx

hooks/
├── useProgreso.ts              # useQuery + useMutation + auto-init + filtros (estado/búsqueda)
└── useCarrerasResumen.ts       # resumen por carrera (GET /estadisticas/carreras-resumen)

services/progreso.service.ts     # obtenerProgreso (GET /progreso?usuarioCarreraId=),
                                  # actualizarProgreso (PATCH /progreso/:id),
                                  # inicializarProgreso (POST /progreso/inicializar)
```

> **Estado:** `ProgresoPage` resuelve la carrera activa con `useCarreraActiva()` (empty state si no hay
> carreras). Usa `Filtros` (`FiltroEstado`/`FiltroBusqueda` con debounce), `ProgresoTree` como única
> vista (árbol Año → Cuatrimestre) y `CarrerasResumenList` (selector de carrera activa cuando hay más
> de una). `ProgresoTree` tiene botones **Expandir todo / Contraer todo** alineados a la derecha.
> Maneja error de la query con `QueryError` + botón reintentar.
> `ProgresoPage` se exporta como `export default` (para el lazy import en `routes/lazy-pages.tsx`).
> La inicialización de registros de progreso es automática al entrar sin datos previos.

### Árbol de Composición

```
MainLayout
└── ProgresoPage
    ├── Header "Progreso Académico"
    ├── CarrerasResumenList (si hay >1 carrera: tarjetas + selector de activa)
    ├── Card: Badges de totales (completadas / en proceso / pendientes)
    ├── Barra de filtros: FiltroEstado (pills) + FiltroBusqueda (input debounce)
    └── {carreraInactiva ? (
            Card de aviso: "Carrera inactiva - No se pueden modificar progresos"
          ) : (
            <>
                ProgresoTree (única vista, árbol por año y cuatrimestre)
                    ├── Accordion "N° Año"
                    │   └── Accordion "N° Cuatrimestre"
                    │       ├── Header: Nro | Materia | Código | Créd. | Estado | Nota | Tipo | (acciones)
                    │       └── MateriaProgresoRow (por cada materia)
            </>
          )}
```

---

## Manejo del Estado Local — `useProgreso`

```typescript
export function useProgreso(usuarioCarreraId: number | null) {
    const [filtroEstado, setFiltroEstado] = useState('todas');
    const [busqueda, setBusqueda] = useState('');
    const initializedRef = useRef<Set<number>>(new Set());

    const { data: progresos, isLoading, error } = useQuery({
        queryKey: ['progreso', usuarioCarreraId],
        queryFn: () => progresoService.obtenerProgreso(usuarioCarreraId!),
        enabled: !!usuarioCarreraId,
    });

    // Auto-init: crea registros Pendiente cuando la consulta devuelve vacío
    useEffect(() => {
        if (!usuarioCarreraId || isLoading || error || !progresos || progresos.length > 0) return;
        if (initializedRef.current.has(usuarioCarreraId)) return;
        initializedRef.current.add(usuarioCarreraId);
        progresoService.inicializarProgreso(usuarioCarreraId).then(() => {
            queryClient.invalidateQueries({ queryKey: ['progreso', usuarioCarreraId] });
        });
    }, [usuarioCarreraId, progresos, isLoading, error]);

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
             eliminar: (id) => deleteMutation.mutate(id),
             isLoading: isLoading || mutation.isPending };
}
```

### Fila Individual — `MateriaProgresoRow`

Cada fila ya no edita en línea. Usa:
- **Chip de estado** con color (verde/amarillo/rojo) y nombre
- **Pencil icon** → abre `EditarProgresoModal` para cambiar estado/nota/tipo
- **Trash icon** (solo si no es Pendiente) → modal de confirmación para resetear a Pendiente

Columnas: Nro (1) | Materia (3) | Código (2) | Créd. (1) | Estado (2) | Nota (1) | Tipo (1) | acciones (1).

### EditarProgresoModal

Modal con select de estado, y condicionalmente nota (input numérico) y tipo (select Final/Promoción).
Validaciones:
- Promoción requiere nota ≥ 7
- Final requiere nota ≥ 4
- Borde rojo en nota si no cumple mínimo según tipo seleccionado
- Errores se limpian al cambiar cualquier campo

---

## Comportamiento UX/UI

### ProgresoTree — Vista Principal (única)

Vista árbol con acordeones Año → Cuatrimestre (controlados vía props `open`/`onOpenChange`).
Cada cuatrimestre tiene un header de columnas:
Nro | Materia | Código | Créd. | Estado | Nota | Tipo | (acciones). Los datos vienen del backend
con `anio`, `cuatrimestre` y `orden` incluidos en la respuesta de `GET /progreso`. En la parte superior
derecha tiene los botones **Expandir todo / Contraer todo** que abren/cierran todos los años y
cuatrimestres a la vez.

### Validaciones del Lado del Cliente

| Regla | Comportamiento |
|---|---|
| Promoción con nota < 7 | Error en el modal (borde rojo) |
| Final con nota < 4 | Error en el modal (borde rojo) |
| Resetear materia | Modal de confirmación; llama a `onSave({ estado: 'Pendiente' })` |
| Error de correlativas del backend | El backend rechaza; el error se propaga vía React Query |
| Búsqueda | `Filtros.FiltroBusqueda` aplica debounce de 300ms y filtra el árbol |

### Estados de la Página

| Estado | Comportamiento |
|---|---|
| Cargando | `ProgresoSkeleton`: 10 filas simuladas |
| Sin resultados tras filtrar | `ProgresoTree` muestra "No hay materias para mostrar" |
| Cambio de carrera | `useProgreso` refetch por `queryKey` + auto-init si es necesario |
| Sin carrera activa | `EmptyState` con enlace a "Ver carreras" |
| Carrera inactiva | Se muestra card de aviso (rojo) indicando que no se pueden editar progresos; botones Expandir/Contraer, filtros y `ProgresoTree` se ocultan |
