import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { logger } from '../src/utils/logger';

// Ruta a los archivos
const charactersFilePath = path.join(__dirname, '../data/characters.json');
const outputDir = path.join(__dirname, '../knowledge/player-characters');

// Asegurar que el directorio existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Función para sanitizar nombres de archivo
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^\w\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-')     // Reemplazar espacios con guiones
    .toLowerCase();
}

// Función para convertir a formato markdown
function createMarkdownContent(data: any): string {
  let content = `# ${data.printable_hash?.info?.name || 'Personaje'}\n\n`;

  // Agregar campos solo si existen
  if (data.printable_hash?.info?.level_desc) {
    content += `**Nivel:** ${data.printable_hash.info.level_desc}\n\n`;
  }

  if (data.printable_hash?.info?.race_name) {
    content += `**Raza:** ${data.printable_hash.info.race_name}`;
    
    // Añadir subraza si existe
    if (data.printable_hash?.info?.subrace_name) {
      content += ` (${data.printable_hash.info.subrace_name})`;
    }
    content += '\n\n';
  }

  // Campos adicionales
  if (data.printable_hash?.fields?.alineamiento) {
    content += `## Alineamiento\n${data.printable_hash.fields.alineamiento}\n\n`;
  }

  if (data.printable_hash?.fields?.apariencia) {
    content += `## Apariencia\n${data.printable_hash.fields.apariencia}\n\n`;
  }

  if (data.printable_hash?.fields?.edad) {
    content += `## Edad\n${data.printable_hash.fields.edad}\n\n`;
  }

  if (data.printable_hash?.fields?.historia) {
    content += `## Historia\n${data.printable_hash.fields.historia}\n\n`;
  }

  return content;
}

// Función para procesar un personaje
async function processCharacter(character: any): Promise<void> {
  try {
    logger.info(`Procesando: ${character.name} (${character.url})`);
    
    const response = await axios.get(character.url);
    const data = response.data;
    
    if (!data || !data.printable_hash) {
      logger.warn(`No se encontraron datos para: ${character.name}`);
      return;
    }
    
    const markdown = createMarkdownContent(data);
    const filename = sanitizeFilename(character.name);
    const outputPath = path.join(outputDir, `${filename}.md`);
    
    fs.writeFileSync(outputPath, markdown);
    logger.info(`Archivo creado: ${outputPath}`);
    
  } catch (error) {
    logger.error(`Error procesando ${character.name}:`, error);
  }
}

// Función principal
async function main() {
  try {
    // Leer el archivo JSON
    const charactersData = JSON.parse(fs.readFileSync(charactersFilePath, 'utf8'));
    
    logger.info(`Encontrados ${charactersData.length} personajes para procesar`);
    
    // Procesar cada personaje con un pequeño retraso entre solicitudes
    for (let i = 0; i < charactersData.length; i++) {
      await processCharacter(charactersData[i]);
      
      // Pequeña pausa entre solicitudes para no sobrecargar el servidor
      if (i < charactersData.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    logger.info('Procesamiento completado!');
    
  } catch (error) {
    logger.error('Error en el proceso:', error);
  }
}

// Ejecutar programa principal
main().catch(error => {
  logger.error('Error general:', error);
  process.exit(1);
}); 