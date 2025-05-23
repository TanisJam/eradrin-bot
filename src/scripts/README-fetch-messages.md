# Script para obtener mensajes de Discord para ingest-knowledge

Este script permite extraer todos los mensajes de un canal de Discord, incluyendo los hilos (threads) asociados, y guardarlos como archivos markdown individuales para ser consumidos por el script `ingest-knowledge`.

## Requisitos

- Node.js
- pnpm instalado
- Un bot de Discord con los permisos necesarios
- Token de acceso del bot

## Configuración

1. Crea un archivo `.env` en la raíz del proyecto o añade las siguientes variables:

```
TOKEN=tu_token_del_bot
CHANNEL_ID=id_del_canal_a_extraer
```

El token del bot lo puedes obtener del [Portal de Desarrolladores de Discord](https://discord.com/developers/applications).

El ID del canal lo puedes obtener activando el modo desarrollador en Discord (Configuración > Avanzado > Modo desarrollador) y luego haciendo clic derecho en el canal > "Copiar ID".

## Permisos necesarios para el bot

El bot necesita los siguientes permisos:
- `Read Messages/View Channels`
- `Read Message History`
- Acceso a los hilos privados (si quieres acceder a ellos)

## Ejecución

Para ejecutar el script:

```bash
pnpm exec tsx scripts/fetch-channel-messages.ts
```

## Resultado

El script generará archivos markdown individuales en la carpeta `/knowledge/stories/`:

- Cada mensaje principal se guardará como un archivo markdown independiente
- El nombre del archivo será generado a partir de las primeras 10 palabras del mensaje
- Si el mensaje tiene hilos (threads), se incluirán como secciones dentro del mismo archivo markdown
- El formato es compatible con el script `ingest-knowledge` para incorporar el contenido a la base de conocimiento

### Estructura de los archivos markdown

```markdown
# [Primeras palabras del mensaje]

[Contenido completo del mensaje principal]

## Respuestas

### [Nombre del autor] - [Fecha]

[Contenido de la respuesta]

### [Nombre del autor] - [Fecha]

[Contenido de otra respuesta]
```

## Limitaciones

- El script está limitado por la API de Discord, que puede tener restricciones de velocidad.
- Para canales muy grandes, el script puede tardar bastante tiempo en completarse.
- Es posible que el script no pueda acceder a mensajes muy antiguos (más de 2 semanas) en canales muy activos debido a limitaciones de la API de Discord.
- Los nombres de archivo generados a partir del contenido pueden truncarse si son muy largos. 