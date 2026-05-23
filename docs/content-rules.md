# Content Rules — Handbook Modulor Studios

Documento de referencia para la cascada de contenido entre tiers. Usado por el comando `/update-handbook`.

---

## 1. Definiciones de tiers

### Full
- **Audiencia:** Leadership (partners, heads de boutique)
- **Acceso:** Solo por invitación
- **Contenido:** Todo. Financieros, pricing, estrategia, M&A, headcount, KPIs, roadmap, productos propios, internacionalización.
- **Es la fuente de verdad.** Los otros tiers derivan de este.

### Lite
- **Audiencia:** Leadership (partners, heads de boutique)
- **Acceso:** Solo por invitación
- **Contenido:** Sustancialmente idéntico a Full. Diferencias editoriales menores (ver sección de cascada).
- **Propósito:** Versión con formato ligeramente simplificado para contexto de IA y consulta rápida.

### Redux (Team)
- **Audiencia:** Todo el grupo Modulor (~125 personas)
- **Acceso:** Dominio corporativo aprobado
- **Contenido:** Operativo y de posicionamiento. **Sin información financiera, pricing, estrategia ni datos sensibles de negocio.**
- **Propósito:** Que cualquier persona del grupo entienda qué hace cada boutique, a quién se dirige y cuándo derivar.

---

## 2. Clasificación de sensibilidad

Cada dato o sección del handbook se clasifica en uno de cuatro niveles. Esta clasificación determina si el contenido llega a redux/ o se queda solo en full/ y lite/.

| Nivel | Ejemplos | Full | Lite | Redux |
|-------|----------|------|------|-------|
| **Alto** | Revenue, márgenes, EBITDA, pricing (€), estrategia M&A, valoración, runway | Si | Si | **NO** |
| **Medio-Alto** | Headcount por boutique, pipeline comercial, coste de contratación, objetivos financieros, contrataciones previstas | Si | Si | **NO** |
| **Medio** | Clientes (nombres), posicionamiento competitivo, casos de éxito con métricas | Si | Si | Si |
| **Bajo** | Identidad, servicios (sin pricing), ICP, cross-selling, directorio de empleados, herramientas | Si | Si | Si |

### Regla general
> Si tienes duda sobre la sensibilidad de un dato, clasifícalo un nivel más alto y consulta al usuario.

---

## 3. Reglas de cascada Full → Lite

El tier Lite es **casi idéntico** al Full en contenido. Las diferencias son editoriales, no estructurales.

### Diferencias específicas

| Elemento | Full | Lite |
|----------|------|------|
| **Footer** | `*Documento actualizado: {Mes} {Año}*` + `*Version: X.0 — Full (...)*` | `*Última actualización: {Mes} {Año}*` (sin número de versión) |
| **intro.md** | Versión completa con lista numerada de "Por qué existe este Handbook" (4 puntos) | Versión condensada: un párrafo resumen en lugar de la lista numerada |
| **Contenido de capítulos** | Completo | Idéntico al Full |
| **Tablas y datos** | Completos | Idénticos al Full |

### Proceso de cascada
1. Para cada archivo modificado en `full/`, lee el correspondiente en `lite/`.
2. Aplica exactamente los mismos cambios de datos y contenido.
3. Ajusta el footer al formato Lite.
4. No toques la estructura editorial que ya difiere (como intro.md).

---

## 4. Reglas de cascada Full → Redux

El tier Redux aplica un **filtro estructural**: se eliminan secciones completas y datos específicos.

### Secciones a ELIMINAR en redux/ (no deben existir)

Estas secciones del Full **no aparecen** en Redux. Si un cambio afecta solo a estas secciones, no hay nada que hacer en redux/.

**En `00_Core_Modulor.md`:**
- Modelo Financiero del Grupo (§04)
- Operaciones de Grupo (§05) — salvo "Herramientas de Grupo" que sí se incluye
- Estrategia y Roadmap (§09)
- Productos Propios (§10)
- Internacionalización (§11)
- KPIs de Grupo (§12)
- Roadmap 2025-2028 (§13)

**En capítulos de boutique (01-05):**
- Modelo de Negocio / Modelo Financiero
- KPIs
- Pricing (tablas con importes €)
- Objetivos financieros
- Contrataciones previstas

### Datos a ELIMINAR de tablas que sí se incluyen

| Dato | Acción en redux/ |
|------|------------------|
| Columna "Headcount" en tablas de boutiques | Eliminar columna |
| Importes EUR (€) en tablas de servicios | Eliminar importes, dejar descripción del servicio |
| "Contrataciones previstas" | Eliminar fila/sección |
| Objetivos financieros numéricos | Eliminar |

### Contenido que SÍ se mantiene intacto en redux/

- Identidad de cada boutique (misión, visión, claim)
- Servicios (descripción, sin pricing)
- Cliente ideal (ICP)
- Casos de éxito (sin métricas financieras internas)
- Cross-selling y matrices de derivación
- Directorio de empleados (`06_Directorio_Equipo.md`) — completo en los tres tiers
- Herramientas de grupo
- Clientes del grupo

### Proceso de cascada
1. Para cada cambio aprobado, evalúa su sensibilidad.
2. Si sensibilidad = Alto o Medio-Alto → **no aplicar** a redux/. Registrar como "omitido por sensibilidad".
3. Si sensibilidad = Medio o Bajo → leer `redux/{capítulo}.md` y aplicar el cambio.
4. Verificar que no se filtren datos sensibles al aplicar cambios de sensibilidad baja que incluyan contexto sensible adyacente.
5. Ajustar footer al formato Redux: `*Última actualización: {Mes} {Año}*`

---

## 5. Guía de estilo

### Idioma
- Todo el contenido está en **español**.
- Términos técnicos en inglés se mantienen cuando son estándar del sector (CRM, SaaS, growth, branding, UX, etc.).
- Nombres de boutiques se escriben tal cual: mendesaltaren (minúscula), Tailor Hub, SSTIL, Nocodehackers, FIK.

### Formato Markdown
- Encabezados de sección: `## 01. Nombre de Sección`
- Subsecciones: `### Nombre`
- Tablas: formato estándar Markdown con alineación
- Listas: usar `-` para items, no `*`
- Negrita para énfasis: `**texto**`
- Cursiva solo para footers y notas: `*texto*`

### Fechas
- En footers: `{Mes} {Año}` — ej: "Mayo 2026"
- En texto: formato largo — ej: "mayo de 2026"

### Footers por tier
- **Full:** Dos líneas separadas por `---`:
  ```
  ---

  *Documento actualizado: Mayo 2026*
  *Version: 3.0 — Full (Holding + Handbook Operativo fusionados)*
  ```
- **Lite:** Una línea después de `---`:
  ```
  ---

  *Última actualización: Mayo 2026*
  ```
- **Redux:** Una línea después de `---`:
  ```
  ---

  *Última actualización: Mayo 2026*
  ```

### Números
- Porcentajes: "15%" (sin espacio)
- Importes: "1.2M€" o "150.000€" (punto como separador de miles, sin espacio antes de €)
- Headcount: número entero — "23 personas"

---

## 6. Casos especiales

### Sincronización de empleados

Cuando cambian datos de empleados (altas, bajas, cambios de puesto):

1. **`06_Directorio_Equipo.md`** — Actualizar la tabla correspondiente a la boutique. Este archivo es idéntico en los tres tiers.
2. **Headcount en capítulos de boutique** — Actualizar el número en la sección de equipo del capítulo correspondiente (solo full/ y lite/; redux/ no tiene headcount).
3. **Headcount total en `00_Core_Modulor.md`** — Actualizar "Mapa de Boutiques" con el nuevo total (solo full/ y lite/).

### Propagación de headcount

El headcount aparece en tres lugares y debe ser consistente:
- `06_Directorio_Equipo.md` → conteo real de filas por boutique
- `{XX}_{boutique}.md` → sección de equipo con número declarado
- `00_Core_Modulor.md` → tabla "Mapa de Boutiques" con headcount por boutique y total

Si se actualiza uno, verificar los otros dos.

### Dependencias entre capítulos

| Si cambia... | Verificar también... |
|---|---|
| Revenue de una boutique | Revenue consolidado en `00_Core_Modulor.md` |
| Servicios de una boutique | Matrices de cross-selling en `00_Core_Modulor.md` y en otras boutiques |
| Empleados de una boutique | `06_Directorio_Equipo.md` + headcount en `00_Core_Modulor.md` |
| Clientes de una boutique | Lista de clientes del grupo en `00_Core_Modulor.md` |
| Pricing de una boutique | Solo full/ y lite/ — verificar que no se filtre a redux/ |

---

## 7. Distribución a otras apps

El handbook tiene cuatro puntos de distribución. El comando `/update-handbook` opera sobre el **principal** (`handbook/_content/current/`). Las otras apps pueden tener copias desactualizadas.

| App | Ruta | Tiers | Notas |
|-----|------|-------|-------|
| **handbook/** (principal) | `handbook/_content/current/` | full, lite, redux | Versionado. Fuente de verdad. |
| **docs/** | `docs/content/` | full, lite | Estático. Sin versionado. Puede quedar desactualizado. |
| **leadership/** | `leadership/_content/` | full, lite | Estático. Sin versionado. |
| **team/** | `team/_content/` | redux | Estático. Sin versionado. Sin `06_Directorio`. |

> **Nota:** La sincronización de `docs/`, `leadership/` y `team/` con el contenido de `handbook/_content/current/` es un paso manual posterior. El comando `/update-handbook` solo actualiza `handbook/_content/current/`.
