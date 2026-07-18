# Página Plan de Estudios — Especificación Técnica

## Estructura de Componentes

```
pages/
├── CarrerasPage.tsx
└── CarreraDetailPage.tsx

components/carrera/
├── CarreraCard.tsx               # Tarjeta con datos de la carrera + acceso al plan
├── CarreraList.tsx               # Lista de carreras del usuario
├── PlanEstudiosTree.tsx          # Árbol jerárquico: Año → Cuatrimestre → Materias
├── PlanEstudiosTable.tsx         # Tabla plana con todas las materias (alternativa)
├── MateriaDetailModal.tsx        # Modal con info detallada + correlativas
├── CorrelativasList.tsx          # Lista de correlativas de una materia
├── MateriaBadge.tsx              # Badge con estado de la materia para el usuario
└── InscribirCarreraModal.tsx     # Modal para inscribirse a una nueva carrera

components/ui/
├── Card.tsx
├── Modal.tsx
├── Badge.tsx
├── Tabs.tsx                      # Vista árbol / tabla
├── Accordion.tsx                 # Años expandibles
└── LoadingSpinner.tsx
```

### Árbol de Composición

```
Ruta: /carreras
└── CarrerasPage
    ├── Header "Mis carreras"
    ├── CarreraList
    │   ├── CarreraCard (por cada carrera activa del usuario)
    │   └── Botón "+ Inscribirse a nueva carrera" → abre InscribirCarreraModal
    └── InscribirCarreraModal
        ├── Select de carreras disponibles
        ├── DatePicker (fecha de inicio)
        └── Botón "Confirmar inscripción"

Ruta: /carreras/:id
└── CarreraDetailPage
    ├── Header con nombre de la carrera
    ├── Tabs
    │   ├── "Plan de estudios" (default)
    │   └── "Vista tabla"
    │
    ├── PlanEstudiosTree (default)
    │   ├── Accordion "1° Año"
    │   │   ├── Acordeón "1° Cuatrimestre"
    │   │   │   ├── MateriaRow (nombre, orden, código, créditos, badge estado)
    │   │   │   │   └── onClick → abre MateriaDetailModal
    │   │   │   └── MateriaRow (...)
    │   │   └── Acordeón "2° Cuatrimestre"
    │   │       └── MateriaRow (...)
    │   ├── Accordion "2° Año"
    │   │   └── ...
    │   └── ...
    │
    └── MateriaDetailModal
        ├── Nombre, código, créditos, carga horaria
        ├── Descripción
        ├── CorrelativasList
        │   ├── "Para cursar esta materia necesitás aprobar:"
        │   └── Lista de materias correlativas con link a cada una
        └── Badge de estado del usuario en esta materia
```

---

## Manejo del Estado Local

### Hook Personalizado: `useCarreras`

```typescript
// hooks/useCarreras.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carrerasService } from '../services/carreras.service';
import { useAuthStore } from '../store/auth.store';

export function useCarreras() {
    const usuario = useAuthStore((s) => s.usuario);

    return useQuery({
        queryKey: ['carreras', usuario?.id],
        queryFn: () => carrerasService.obtenerCarrerasDelUsuario(usuario!.id),
        enabled: !!usuario,
    });
}
```

### Hook Personalizado: `usePlanEstudios`

```typescript
// hooks/usePlanEstudios.ts
import { useQuery } from '@tanstack/react-query';
import { carrerasService } from '../services/carreras.service';

export function usePlanEstudios(carreraId: number | undefined) {
    return useQuery({
        queryKey: ['plan-estudios', carreraId],
        queryFn: () => carrerasService.obtenerPlanEstudios(carreraId!),
        enabled: !!carreraId,
    });
}
```

### Hook Personalizado: `useInscribirCarrera`

```typescript
// hooks/useInscribirCarrera.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { carrerasService } from '../services/carreras.service';
import { useAuthStore } from '../store/auth.store';

export function useInscribirCarrera() {
    const queryClient = useQueryClient();
    const usuario = useAuthStore((s) => s.usuario);

    return useMutation({
        mutationFn: (data: { carreraId: number; fechaInicio: string }) =>
            carrerasService.inscribirCarrera(usuario!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['carreras', usuario!.id] });
        },
    });
}
```

---

## Comportamiento UX/UI

### PlanEstudiosTree — Árbol de Materias

```
┌──────────────────────────────────────────────────┐
│  1° Año                                           │
│  ┌──────────────────────────────────────────────┐ │
│  │  ▼ 1° Cuatrimestre                           │ │
│  │                                              │ │
│  │  [1] Álgebra           MAT101  8 créd. 🟢 CP │ │
│  │  [2] Programación I    PROG1  8 créd. 🟡 EP  │ │
│  │  [3] Inglés Técnico    ING101 4 créd. 🔴 PTE │ │
│  │                                              │ │
│  │  ▼ 2° Cuatrimestre                           │ │
│  │                                              │ │
│  │  [4] Cálculo I         MAT201  8 créd. 🟢 CP │ │
│  │  [5] Programación II   PROG2  8 créd. 🟢 CP │ │
│  │  ...                                         │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  2° Año                                            │
│  ┌──────────────────────────────────────────────┐ │
│  │  ▼ 1° Cuatrimestre                           │ │
│  │  ...                                         │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘

Leyenda:
🟢 CP = Completada    🟡 EP = En Proceso    🔴 PTE = Pendiente
```

### MateriaDetailModal — Detalle de Materia

```
┌──────────────────────────────────────────┐
│  ×  Álgebra Lineal                        │
│  ──────────────────────────────────────── │
│                                           │
│  Código:     MAT102                       │
│  Créditos:   8                            │
│  Carga:      96 horas                     │
│  Estado:     🟢 Completada (Nota: 8)      │
│                                           │
│  Descripción:                             │
│  Espacios vectoriales, transformaciones    │
│  lineales, autovalores y autovectores.    │
│                                           │
│  Correlativas:                            │
│  ✅ Álgebra (MAT101) — Completada         │
│                                           │
│  Es correlativa de:                       │
│  → Cálculo II (MAT202)                   │
│  → Estadística (MAT301)                  │
└──────────────────────────────────────────┘
```

### InscribirCarreraModal

```
┌──────────────────────────────────────────┐
│  ×  Inscribirse a una carrera             │
│                                           │
│  Carrera:  [▼ Ingeniería en Sistemas  ]  │
│                                           │
│  Fecha de inicio:  [01/03/2026      ]    │
│                                           │
│  [Cancelar]  [Confirmar inscripción]      │
└──────────────────────────────────────────┘
```

### Interacciones

| Acción | Comportamiento |
|---|---|
| Click en materia | Abre `MateriaDetailModal` con info completa y correlativas |
| Click en correlativa dentro del modal | Navega a la materia correlativa (cierra modal actual y abre el de la otra materia) |
| Hover sobre badge de estado | Tooltip con `"Completada - Nota: 8"`, `"En Proceso"` o `"Pendiente"` |
| Click "Inscribirse" | Abre modal con selector de carrera y fecha |
| Confirmar inscripción | POST a API → invalidar query de carreras → refetch → mostrar nueva carrera en la lista |
| Cambio de pestaña (árbol/tabla) | Switch visual sin perder el estado de scroll |

### Estados

| Estado | Comportamiento |
|---|---|
| Cargando plan de estudios | `Skeleton` con estructura de acordeones simulados |
| Error al cargar plan | `Alert` con "No se pudo cargar el plan de estudios" + botón "Reintentar" |
| Plan vacío (sin materias) | `EmptyState` "Esta carrera aún no tiene materias asignadas en el plan de estudios" |
| Carrera sin inscripción activa | Botón "Inscribirse" destacado |
| Usuario sin ninguna carrera | `EmptyState` con CTA a la pantalla de carreras disponibles |
