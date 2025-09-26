# Estrategia de Pruebas para Eradrin Bot

Este directorio contiene las pruebas automatizadas para el bot Eradrin. La estrategia de pruebas está diseñada para verificar el correcto funcionamiento del bot a diferentes niveles, desde pruebas unitarias hasta pruebas de integración.

## Estructura de pruebas

```
/tests
├── unit/                     # Pruebas unitarias
│   ├── commands/             # Pruebas para comandos individuales
│   ├── services/             # Pruebas para servicios
│   └── utils/                # Pruebas para utilidades
├── integration/              # Pruebas de integración
│   ├── database/             # Pruebas de modelos y operaciones de base de datos
│   └── discord/              # Pruebas de interacción con Discord
└── mocks/                    # Mocks y stubs para pruebas
```

## Configuración

- **Jest**: Framework principal para todas las pruebas
- **ts-jest**: Integración con TypeScript
- **SQLite en memoria**: Base de datos para pruebas

## Comandos disponibles

```bash
# Ejecutar todas las pruebas
pnpm test

# Ejecutar pruebas con actualización automática durante el desarrollo
pnpm test:watch

# Generar informe de cobertura
pnpm test:coverage

# Ejecutar solo pruebas unitarias
pnpm test:unit

# Ejecutar solo pruebas de integración
pnpm test:integration
```

## Mejores prácticas

1. **Pruebas unitarias**:
   - Mantener pruebas independientes y aisladas
   - Usar mocks para dependencias externas
   - Cubrir casos positivos y negativos

2. **Pruebas de integración**:
   - Usar base de datos en memoria para pruebas
   - Limpiar datos entre pruebas
   - Verificar correcta interacción entre componentes

3. **Mocks**:
   - Proporcionar simulaciones consistentes de servicios externos
   - Mantener los mocks actualizados cuando la API de Discord cambie

## Añadir nuevas pruebas

Para añadir nuevas pruebas, sigue estos pasos:

1. Identifica el nivel apropiado (unitario o integración)
2. Crea el archivo en el directorio correspondiente usando la nomenclatura `nombre.test.ts`
3. Sigue el patrón de las pruebas existentes
4. Utiliza mocks cuando sea necesario para aislar la funcionalidad
5. Ejecuta las pruebas para verificar que pasan

## Integración continua

Las pruebas se ejecutan automáticamente en cada push o pull request mediante GitHub Actions, asegurando que los cambios no rompan la funcionalidad existente.

## Cobertura de código

Se recomienda mantener una cobertura de código de al menos el 80% para las funcionalidades críticas del bot. 