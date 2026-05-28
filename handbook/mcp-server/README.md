# Modulor Handbook MCP Server

Servidor MCP que expone el contenido del Handbook de Modulor Studios a asistentes de IA (Claude Desktop, Claude Code, Cursor, etc.).

## Setup

```bash
cd handbook/mcp-server
npm install
```

## Configuración por herramienta

El bloque de configuración es el mismo en todos los casos — solo cambia dónde se añade.

```json
{
  "modulor-handbook": {
    "command": "node",
    "args": ["<ruta-absoluta>/handbook/mcp-server/index.js"]
  }
}
```

Reemplaza `<ruta-absoluta>` con la ruta completa al directorio del proyecto en tu máquina.

### Claude Desktop

Archivo: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

```json
{
  "mcpServers": {
    "modulor-handbook": {
      "command": "node",
      "args": ["/ruta/al/handbook/mcp-server/index.js"]
    }
  }
}
```

Reiniciar Claude Desktop después de guardar.

### Claude Code

```bash
claude mcp add modulor-handbook node /ruta/al/handbook/mcp-server/index.js
```

O manualmente en `.claude/settings.json` (proyecto) o `~/.claude/settings.json` (global), dentro de `"mcpServers"`.

### Cursor

Archivo: `.cursor/mcp.json` en la raíz del proyecto.

```json
{
  "mcpServers": {
    "modulor-handbook": {
      "command": "node",
      "args": ["/ruta/al/handbook/mcp-server/index.js"]
    }
  }
}
```

### Windsurf

Archivo: `~/.codeium/windsurf/mcp_config.json`

Mismo formato que Cursor.

## Flag `--tier`

Para bloquear el servidor a un tier específico (sin permitir que el usuario cambie de tier):

```bash
node mcp-server/index.js --tier=redux   # Solo contenido team
node mcp-server/index.js --tier=full    # Contenido completo (leadership)
node mcp-server/index.js --tier=lite    # Resumen ejecutivo (leadership)
```

Cuando se usa `--tier`, el parámetro `tier` se elimina del schema de los tools — el servidor siempre usa el tier indicado. Sin el flag, el comportamiento es el actual (tier como parámetro con default `full`).

Ejemplo en configuración:

```json
{
  "modulor-handbook": {
    "command": "node",
    "args": ["/ruta/al/handbook/mcp-server/index.js", "--tier=redux"]
  }
}
```

## Tools disponibles

| Tool | Descripción |
|------|-------------|
| `list_chapters` | Lista capítulos con ID, título y tamaño |
| `read_chapter` | Lee el contenido completo de un capítulo |
| `search_handbook` | Busca texto en todos los capítulos con contexto |

### Parámetros comunes

| Param | Valores | Default | Descripción |
|-------|---------|---------|-------------|
| `tier` | `full`, `lite`, `redux` | `full` | Nivel de contenido |
| `lang` | `es`, `en` | `es` | Idioma |
| `version` | `V1.0.0`, etc. | current | Versión del handbook |

## Verificación

Para comprobar que funciona, usa el MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node mcp-server/index.js
```

Esto abre una interfaz web donde puedes llamar a cada tool y ver las respuestas.
