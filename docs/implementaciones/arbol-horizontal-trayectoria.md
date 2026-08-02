# Árbol de Trayectoria Horizontal con Cards — Documento de Implementación

## 1. Resumen del requerimiento

Eliminar la vista de "Línea de tiempo" del detalle de trayectoria, y reemplazar el árbol vertical por un **árbol horizontal izquierda→derecha** donde cada nodo se renderiza como una **card** (mismo formato visual que `PlanificacionCard`). Las cards deben estar conectadas visualmente a sus hijos y el contenedor debe permitir desplazamiento con el mouse (drag-to-scroll).

**Motivación:** La línea de tiempo no representa bifurcaciones y resulta confusa. El árbol horizontal con cards ofrece una visión completa y clara de todas las ramas.

---

## 2. Archivos a modificar

| Archivo | Tipo de cambio |
|---|---|
| `frontend/src/components/planificacion/ArbolTrayectoria.tsx` | Reescritura completa |
| `frontend/src/pages/TrayectoriaPage.tsx` | Simplificación (eliminar timeline, ajustar layout y skeleton) + `min-w-0` |
| `frontend/src/layouts/MainLayout.tsx` | `<main>` pasa a `flex-1 min-w-0` (permite scroll horizontal del contenido) |
| `frontend/src/types/planificacion.types.ts` | Sin cambios (ya existe todo lo necesario) |
| `frontend/src/components/planificacion/PlanificacionCard.tsx` | Sin cambios (se reusa patrón visual, no el componente) |

---

## 3. Diseño del nuevo `ArbolTrayectoria.tsx`

### 3.1 Layout horizontal recursivo

Cada nodo se renderiza como una card, y sus hijos se muestran a la derecha conectados visualmente:

```
┌─────────────┐   ┌───────────────┐   ┌─────────────┐
│  Card Root  │───│  Card Hijo 1  │───│ Card Nieto  │
│  1er C 2026 │   │  2do C 2026   │   │ Verano 2027 │
│  ...        │   │  ...          │   │ ...         │
│ [Ver][Cont] │   │ [Ver][Cont]   │   │ [Ver][Cont] │
└─────────────┘   └───────────────┘   └─────────────┘
                        │
                   ┌────┴────────────┐
                   │                 │
            ┌──────┴──────┐   ┌─────┴──────┐
            │ Card Hijo 2 │   │ Card Hijo 3│
            │             │   │            │
            └─────────────┘   └────────────┘
```

### 3.2 Estructura del componente

```
<div> (contenedor drag-to-scroll)
  └── <div> (flex-row interno, w-max min-w-full pr-16)
       └── <TreeNode> (recursivo)
            ├── Card del nodo actual
            └── [si tiene hijos:]
                 ├── Conector horizontal (w-6, h-px)
                 └── Columna de hijos (border-l-2 + flex-col)
                      ├── Conector horizontal a hijo 1 (w-4, h-px)
                      ├── <TreeNode hijo 1>
                      ├── Conector horizontal a hijo 2 (w-4, h-px)
                      ├── <TreeNode hijo 2>
                      └── ...
```

### 3.3 Conexiones visuales entre cards

Se usan elementos CSS simples (sin SVG) para las líneas de conexión:

| Elemento | Clases CSS | Descripción |
|---|---|---|
| Línea horizontal padre→hijos | `w-6 shrink-0 flex items-center` + `w-full h-px bg-accent-primary/40` | Sale del borde derecho de la card padre |
| Barra vertical de hijos | `border-l-2 border-accent-primary/40 py-2` | Aplica al contenedor `flex-col` de hijos |
| Línea horizontal a cada hijo | `w-4 shrink-0 flex items-center` + `w-full h-px bg-accent-primary/40` | Conecta la barra vertical a cada card hijo |
| Alineación vertical | `flex items-center gap-0` | En cada nivel para centrar cards con conectores |

### 3.4 Card de cada nodo

Cada card replica el formato visual de `PlanificacionCard` (estructura, colores, espaciado) pero se implementa inline en `ArbolTrayectoria` para evitar dependencia cruzada y permitir los dos botones en el footer.

Estructura de la card:

```tsx
<Card className="w-72 shrink-0 hover:bg-bg-surface-secondary transition-colors">
  <div className="flex flex-col h-full">
    {/* Header: nombre + badge */}
    <div className="flex items-start gap-3 mb-2">
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-text-default truncate">
          {periodo.nombre || `${periodo.anio} ${periodo.instancia}`}
        </h3>
      </div>
      <Badge variant="info" size="sm" className="shrink-0 text-xs whitespace-nowrap">
        {periodo.anio} {periodo.instancia}
      </Badge>
    </div>

    {/* Body: lista de materias */}
    <div className="text-sm text-text-subtle pb-4">
      <span className="text-text-muted">Materias planificadas:</span>
      {materiasUnicas.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {materiasUnicas.map((nombre) => (
            <li key={nombre} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0" />
              {nombre}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-text-muted mt-1 italic">Sin materias planificadas</p>
      )}
    </div>

    {/* Footer: dos botones */}
    <div className="mt-auto pt-4 border-t border-hairline flex gap-2">
      <button
        type="button"
        onClick={() => onNavigate(periodo.periodoId)}
        className="btn-primary flex-1"
      >
        Ver planificación
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onContinuar(periodo.periodoId); }}
        className="btn-ghost"
      >
        + Continuar
      </button>
    </div>
  </div>
</Card>
```

**Botones:**
- "Ver planificación": mismas clases exactas que `PlanificacionCard` → navega a `/planificacion/:id`
- "+ Continuar": estilo ghost más sutil, evita propagación de click → abre `NuevoPeriodoModal` con ese periodo como origen

### 3.5 Drag-to-scroll (Pointer Events)

Se implementa con Pointer Events y listeners en `document` para garantizar que el arrastre funcione aunque el cursor salga del contenedor. No se usa `setPointerCapture` para no interferir con los clicks en los botones de las cards.

```typescript
const containerRef = useRef<HTMLDivElement>(null);
const [isDragging, setIsDragging] = useState(false);
const dragInfo = useRef({ startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0, moved: false });

const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragInfo.current = {
        startX: e.clientX - rect.left,
        startY: e.clientY - rect.top,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
        moved: false,
    };

    const handleMove = (ev: PointerEvent) => {
        if (!containerRef.current) return;
        const r = containerRef.current.getBoundingClientRect();
        const mx = ev.clientX - r.left;
        const my = ev.clientY - r.top;
        const dx = mx - dragInfo.current.startX;
        const dy = my - dragInfo.current.startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
            dragInfo.current.moved = true;
            setIsDragging(true);
        }
        if (dragInfo.current.moved) {
            containerRef.current.scrollLeft = dragInfo.current.scrollLeft - dx;
            containerRef.current.scrollTop = dragInfo.current.scrollTop - dy;
            ev.preventDefault();
        }
    };

    const handleUp = () => {
        setIsDragging(false);
        document.removeEventListener('pointermove', handleMove);
        document.removeEventListener('pointerup', handleUp);
        document.removeEventListener('pointercancel', handleUp);
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    document.addEventListener('pointercancel', handleUp);
};
```

**Clases del contenedor:**
```tsx
<div
    ref={containerRef}
    className={`overflow-auto scrollbar-none touch-none h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none pb-8`}
    onPointerDown={handlePointerDown}
>
```

**Inner container:**
```tsx
<div className="inline-flex items-start gap-0 p-4 w-max min-w-full pr-16">
    {/* nodo raíz y sus hijos recursivamente */}
</div>
```

> **Rueda del mouse:** a diferencia de iteraciones previas, **no** hay handler `wheel` custom. El scroll con la rueda es **exclusivamente vertical** (comportamiento nativo de `overflow: auto`). El único mecanismo de scroll horizontal es el **drag-to-scroll** (o trackpad). Se descartaron los handlers `wheel` que traducían `deltaY` a `scrollLeft` porque el usuario reportó que interferían con el scroll vertical del viewport.

### Detalles técnicos del drag

| Aspecto | Detalle |
|---|---|
| Eventos | Pointer Events (`onPointerDown`) con listeners globales en `document` |
| Botón | Solo botón izquierdo (`if (e.button !== 0) return`) |
| Captura | Sin `setPointerCapture` (los clicks en botones funcionan normalmente) |
| Umbral de arrastre | 4px de movimiento antes de activar el modo drag |
| Scroll ejes | Ambos ejes (X e Y), fórmula `scrollPos = startPos - delta` (direct manipulation) |
| Multiplicador | 1:1 (sin aceleración) |
| Coordenadas | `clientX`/`clientY` (viewport-relative, coherente con `getBoundingClientRect`) |
| Ratón y táctil | Pointer Events cubren ambos; `touch-none` desactiva el scroll nativo táctil sobre el contenedor |
| Finalización | Se escuchan `pointerup` y `pointercancel` para limpiar listeners |

---

## 4. Cambios en `TrayectoriaPage.tsx`

### 4.1 Eliminar secciones redundantes

| Código actual | Acción |
|---|---|
| Card "Línea de tiempo" con timeline dots (líneas 159–197) | Eliminar por completo |
| Card wrapper "Árbol de bifurcaciones" (líneas 199–204) | Eliminar, reemplazar por render directo de `<ArbolTrayectoria>` |
| Variable `sortedPlanificaciones` (líneas 56–60) | Se puede eliminar (ya no se usa para timeline). El tree usa el `arbol` directamente. |

### 4.2 Nuevo layout del detalle

La página usa flex layout full-viewport con `body overflow: hidden` para eliminar scrollbars del navegador. El contenedor usa márgenes negativos para compensar el padding del layout padre (sidebar alignment):

```tsx
<div className="h-screen overflow-hidden flex flex-col gap-6
    -ml-4 sm:-ml-6 lg:-ml-8 -mr-4 sm:-mr-6 lg:-mr-8">
  <!-- Header (shrink-0, con px-4 sm:px-6 lg:px-8) -->
  <div class="flex items-center justify-between shrink-0 px-4 sm:px-6 lg:px-8"> ... </div>

  <!-- Árbol horizontal ocupa el espacio restante -->
  {sortedPlanificaciones.length === 0 ? (
    <div class="px-4 sm:px-6 lg:px-8">
      <EmptyState ... />
    </div>
  ) : arbol && arbol.periodo ? (
    <div class="flex-1 min-h-0 min-w-0">
      <ArbolTrayectoria ... />
    </div>
  ) : null}

  <NuevoPeriodoModal ... />
</div>
```

**Fix `min-w-0` (scroll horizontal):** Sin `min-w-0`, la cadena de flex items del layout se expande al ancho del contenido del árbol (`min-width: auto` = min-content). En la práctica `main` (en `MainLayout.tsx`) y el wrapper `flex-1 min-h-0` llegaban a medir el ancho completo del árbol (p. ej. 5558px), por lo que el contenedor de scroll **no tenía overflow horizontal** (`scrollWidth == clientWidth`), las planificaciones de las ramas derechas quedaban clipadas y el drag no desplazaba nada. Con `min-w-0` en ambos eslabones (`main` con `flex-1 min-w-0`, y el wrapper con `flex-1 min-h-0 min-w-0`), el contenedor conserva el ancho del viewport, el árbol desborda y el drag alcanza el scroll máximo real.

Además, el inner container usa `w-max min-w-full pr-16`:
- `w-max`: el wrapper mide exactamente el ancho natural del árbol (crece con la cantidad de cards).
- `min-w-full`: en árboles más angostos que el contenedor, el wrapper cubre el 100% (sin romper el layout).
- `pr-16`: margen de panning fijo a la derecha para que la última card nunca quede pegada al borde.

Evolución (descartada): `min-w-[120%]` y `min-w-[calc(100%+10rem)]` fijaban un ancho mínimo arbitrario que podía exceder al árbol real, dejando cards fuera del scroll alcanzable.

**Nota:** Las variables `sortedPlanificaciones` y `origenPeriod` se mantuvieron en el código final porque:
- `sortedPlanificaciones.length` se usa para el contador de planificaciones en el header
- `sortedPlanificaciones` y su length determinan si mostrar EmptyState o el árbol
- `origenPeriod` se pasa al modal como `origenAnio`/`origenInstancia`

### 4.3 Empty state

Si no hay planificaciones, se muestra el `EmptyState` con botón "Crear primera planificación" (se mantiene igual).

### 4.4 Skeleton

Reemplazar `TrayectoriaSkeleton` para matchear el nuevo layout horizontal full-viewport:

```tsx
function TrayectoriaSkeleton() {
    return (
        <div className="h-screen overflow-hidden flex flex-col gap-6
            -ml-4 sm:-ml-6 lg:-ml-8 -mr-4 sm:-mr-6 lg:-mr-8">
            <div className="flex items-center gap-4 shrink-0 px-4 sm:px-6 lg:px-8">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div>
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48 mt-1" />
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden flex gap-6 p-1">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-72 shrink-0 space-y-4">
                        <Skeleton className="h-5 w-36" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-9 w-full mt-4" />
                    </div>
                ))}
            </div>
        </div>
    );
}
```

### 4.5 Variables en el código final

| Variable | Estado | Uso actual |
|---|---|---|
| `planificaciones` / `sortedPlanificaciones` | **Mantenida** | Conteo en header (`sortedPlanificaciones.length`), determinación de EmptyState vs árbol, `origenPeriod` para el modal |
| `trayectoria` query (`['trayectoria', trayectoriaId]`) | **Mantenida** | Provee `planificaciones` para el contador y el origen del modal |
| `trayectoriasList` | **Mantenida** | Redirect si la trayectoria ya no existe |
| `trayectoriaNombre` | **Mantenida** | Título del header |
| `handleContinuar`, `handleCrearSucesivo`, `origenSeleccionado` | **Mantenida** | Lógica del modal de nuevo período |
| `origenPeriod` | **Mantenida** | Se pasa al modal como `origenAnio`/`origenInstancia` |
| `usuarioCarreraId`, `carreraActiva` | **Mantenida** | Header muestra nombre de carrera, payload de creación |
| `arbol` (de `useArbolTrayectoria`) | **Mantenida** | Única fuente para el árbol horizontal |

**No se eliminó ninguna variable.** La query `['trayectoria', trayectoriaId]` se mantiene para el contador de planificaciones en el header y para derivar `origenPeriod` para el modal. El árbol usa `useArbolTrayectoria` como fuente independiente.

---

## 5. Flujo de interacción

### 5.1 Click en "Ver planificación"

```
Card → click "Ver planificación" → onNavigate(periodoId) → navigate(`/planificacion/${periodoId}`)
```

### 5.2 Click en "+ Continuar"

```
Card → click "+ Continuar" → onContinuar(periodoId) → handleContinuar(periodoId) →
  setOrigenSeleccionado(periodoId) + setMostrarNuevoPeriodo(true) →
  NuevoPeriodoModal con planificacionOrigenId = periodoId →
  onSubmit → handleCrearSucesivo → POST /api/planificacion/periodos →
  invalidateQueries → navigate a nueva planificación
```

### 5.3 Drag-to-scroll

```
Usuario hace pointerdown (botón izquierdo) en el contenedor →
  registra posición inicial (clientX/clientY vs rect), scrollLeft y scrollTop →
  agrega listeners pointermove/pointerup/pointercancel en document →
  Usuario mueve el puntero →
  si |dx| > 4px o |dy| > 4px: marca como arrastre activo, previene default →
  mientras arrastra: containerRef.scrollLeft = startScrollLeft - dx →
  Usuario suelta (pointerup) →
  remueve listeners, isDragging = false
```

**Diferencia clave con mouse events:** Al usar `document` listeners, el arrastre continúa aunque el cursor salga del contenedor. El umbral de 4px evita que clicks en botones disparen el drag.

---

## 6. Consideraciones de estilo

### 6.1 Cards

- Ancho fijo: `w-72` (288px) para uniformidad visual
- Altura variable según cantidad de materias
- Mismo espaciado y tipografía que `PlanificacionCard`
- `shrink-0` para evitar que se compriman en el flex horizontal

### 6.2 Conectores

- Color: `bg-accent-primary/40` (más sutil que /60 para no robar atención)
- Grosor línea horizontal: `h-px` (1px)
- Grosor barra vertical: `border-l-2` (2px, usa border para mayor visibilidad)
- Espaciado:
  - `w-6` (24px) de la card padre a la barra vertical
  - `w-4` (16px) de la barra vertical a cada card hijo
  - `gap-4` entre hijos en la columna vertical

### 6.3 Scroll container

- `overflow: auto`: scroll nativo en ambos ejes
- `scrollbar-none`: oculta las barras de scroll visualmente (el scroll horizontal es solo con drag; el vertical con la rueda)
- `touch-none`: desactiva el scroll nativo táctil sobre el contenedor (lo maneja el drag con Pointer Events)
- `cursor-grab` / `cursor-grabbing`: feedback visual del drag
- `select-none`: evita selección de texto durante el drag
- `pb-8`: padding inferior para que la última fila de cards no quede pegada al borde inferior
- `w-max min-w-full pr-16` en el inner container: ancho natural del árbol (`w-max`), mínimo 100% del contenedor (`min-w-full`) y margen de panning a la derecha (`pr-16`). El área de scroll **crece con la cantidad de cards** y, cuando el árbol entra completo en pantalla, conserva un pequeño margen para que el mouse pueda desplazarlo. Evolución descartada: `min-w-[120%]` / `min-w-[calc(100%+10rem)]` fijaban un mínimo arbitrario que excedía al árbol real y dejaba cards inalcanzables.

**Nota:** El scroll es bidireccional (X e Y) porque algunas trayectorias con muchas bifurcaciones pueden requerir scroll vertical. A diferencia de la versión inicial (que usaba `overflow-y-hidden`), la implementación final permite scroll vertical natural.

---

## 7. Pruebas de verificación

| Escenario | Comportamiento esperado |
|---|---|
| Trayectoria sin planificaciones | Se muestra EmptyState con botón "Crear primera planificación" |
| Trayectoria con 1 planificación | Se muestra una sola card. Sin conectores. |
| Trayectoria con 3 planificaciones lineales | Cards conectadas horizontalmente: A ─ B ─ C |
| Trayectoria con bifurcaciones | Cards conectadas: A ─┬─ B1 ─ C1, └─ B2 |
| Drag con mouse/touch | El contenedor se desplaza en X e Y |
| Click "Ver planificación" | Navega a `/planificacion/:id` |
| Click "+ Continuar" | Abre `NuevoPeriodoModal` con el periodo como origen |
| Pantalla angosta / viewport pequeño | Scroll horizontal disponible (drag, barras ocultas) |
| Scroll con ruedita del mouse | Scroll **vertical** nativo (sin handler wheel custom) |
| Card con muchas materias | Altura natural, no truncar contenido |
| Card sin materias | Muestra "Sin materias planificadas" en itálica |

---

## 8. Estados de carga y error

| Estado | Visual |
|---|---|
| Cargando árbol | Skeleton con 3 cards de 72 de ancho en horizontal |
| Error al cargar árbol | `QueryError` con botón de reintento |
| Árbol vacío (sin planificaciones) | `EmptyState` con botón "Crear primera planificación" |
| Sin carrera activa | `EmptyState` con botón "Ver carreras" |

---

## 9. Orden de implementación sugerido

| Paso | Descripción | Archivo |
|---|---|---|
| 1 | Reescribir `ArbolTrayectoria.tsx` con layout horizontal + cards + conectores + drag-to-scroll | `frontend/src/components/planificacion/ArbolTrayectoria.tsx` |
| 2 | Simplificar `TrayectoriaPage.tsx`: eliminar timeline, eliminar card wrapper del árbol, actualizar skeleton | `frontend/src/pages/TrayectoriaPage.tsx` |
| 3 | Verificar build (`npm run build`) y lint (`npm run lint`) en frontend | `frontend/` |
