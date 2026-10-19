# Guía de uso de OpenCode con LogiExpress

**Este paquete contiene documentación e instrucciones; NO contiene una aplicación Python implementada.** El propósito es dirigir a OpenCode para construirla paso a paso sin inventar estado del repositorio.

## 1. Colocación de los archivos

Copiar el contenido de este kit dentro de la **raíz del repositorio** donde trabajarás con OpenCode. Mantener nombres y mayúsculas:

- `AGENTS.md` (nombre exacto, plural, mayúsculas): reglas generales que OpenCode lee como contexto de proyecto.
- `.opencode/agents/architect.md` y `.opencode/agents/algorithm-reviewer.md`: subagentes personalizados. **No** se llaman `AGENTS.md`.
- `opencode.json`: configuración inicial con lectura de arquitectura y aprobación antes de editar o ejecutar comandos.
- `docs/`: diseño, contratos, decisiones y plan.

> **Precaución:** si ya tienes un `AGENTS.md`, `opencode.json` o carpeta `docs/`, no sobrescribirlos sin revisión; comparar primero y combinar las instrucciones pertinentes.

## 2. Iniciar OpenCode

Abre un terminal ubicado en la raíz del proyecto y ejecuta `opencode` si ya está instalado. De lo contrario, instala OpenCode siguiendo su documentación oficial. Inicia con **Plan** o pide diagnóstico de solo lectura, luego cambia a **Build** cuando quieras autorizar código.

La configuración inicial contiene:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": ["docs/ARCHITECTURE.md"],
  "permission": { "edit": "ask", "bash": "ask" }
}
```

Se ha elegido aprobación para cambios y comandos de terminal por control durante la creación inicial. Puedes cambiarla deliberadamente una vez valides el flujo, pero evita permitir operaciones destructivas indiscriminadas.

## 3. Primer prompt (diagnóstico; no modificar)

Copia en OpenCode:

> Lee `AGENTS.md`, `docs/REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `docs/DECISIONS.md` y `docs/IMPLEMENTATION_PLAN.md`. Inspecciona el estado real del repositorio sin escribir archivos. Indica qué ya existe, qué falta, qué decisiones son solo propuestas y cuáles requieren confirmar la rúbrica. Diseña únicamente la Etapa 0 con archivos a crear, dependencias mínimas, criterios de aceptación y comandos de verificación. No asumas que está listo el entorno ni ejecutes cambios destructivos.

Evalúa el diagnóstico y aclara solo las decisiones bloqueantes.

## 4. Segundo prompt (bootstrap, cuando el diagnóstico lo justifique)

> Usa modo Build e implementa **solo la Etapa 0** de `docs/IMPLEMENTATION_PLAN.md`, conservando archivos existentes. Crea el mínimo `pyproject.toml`, la estructura importable `src/logiexpress/`, README y un test de importación, según lo que ya esté disponible. No implementes BFS/DFS/Dijkstra ni la interfaz todavía. Antes de editar enumera los archivos; pide aprobación según permisos. Al terminar ejecuta las verificaciones posibles, informa comandos y salidas reales, incluye un diff/resumen de cambios y señala pendientes. Detente después de la Etapa 0.

## 5. Prompt para cada incremento

> Implementa únicamente la **Etapa N** de `docs/IMPLEMENTATION_PLAN.md`. Primero inspecciona el código y revisa `docs/CONTRACTS.md`; identifica archivos exactos, estructura de datos, entradas/salidas y riesgos. Realiza el cambio mínimo y escribe pruebas de regresión de los casos relevantes. No cruces responsabilidades entre dominio, algoritmos, servicios y UI. Ejecuta pruebas/linter cuando sea posible y reporta resultados reales y diff. No empieces otra etapa. Si una decisión existente difiere del documento, explícala antes de cambiarla.

Sustituye `N` por el número de la etapa actual.

## 6. Auditoría independiente

Después de una etapa de algoritmos:

> `@algorithm-reviewer` Revisa las implementaciones reales y los tests existentes sin escribir código. Indica hallazgos con severidad, evidencia, casos de reproducción y pruebas de regresión propuestas. Contrasta con `docs/CONTRACTS.md`.

Cuando un cambio modifique varios módulos:

> `@architect` Revisa límites entre módulos, dependencias, complejidad accidental y coherencia con las decisiones propuestas. No edites archivos. Entrega hallazgos priorizados y mejoras mínimas.

## 7. Seguimiento de estado

Recomienda que OpenCode cree y mantenga un `docs/STATUS.md` **después** del bootstrap, indicando para cada elemento: `propuesto`, `aprobado`, `implementado`, `probado`, `pendiente`. **Implementado** no equivale a **probado**. Registrar la ruta del commit o diff cuando exista, fecha y comando de prueba con resultado.

## 8. Referencia de OpenCode

- Instrucciones `AGENTS.md`: https://docs.opencode.ai/docs/rules/
- Agentes personalizados: https://opencode.ai/docs/es/agents/
- Permisos: https://docs.opencode.ai/docs/permissions/
- Configuración: https://docs.opencode.ai/docs/config/

La sintaxis incluida sigue la documentación de OpenCode consultada al preparar este kit (2026-10-19); OpenCode podría actualizar formatos en versiones futuras.
