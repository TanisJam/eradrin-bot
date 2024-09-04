import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Muestra una lista de comandos disponibles.');

export async function execute(interaction: CommandInteraction) {
  const helpMessage = `
  **🆘 Comandos Disponibles:**  
  1. **❓ /ask** - Pregúntale algo a Eradrin.
     - Opciones: 
       - \`question\` [requerido]: La pregunta que quieres hacerle a Eradrin.
  
  2. **👤 /character** - Recibe información de un personaje.
     - Opciones: 
       - \`name\` [requerido]: Nombre del personaje.
  
  3. **🏓 /ping** - Responde con "Pong!".
  
  4. **🎲 /roll** - Tira unos dados.
     - Opciones: 
       - \`dice\` [requerido]: El dado a tirar.
         - Opciones disponibles: d2, d4, d6, d8, d10, d12, d20, d100.
       - \`number\` [opcional]: El número de dados a tirar.
       - \`mod\` [opcional]: El modificador a añadir al resultado.
       - \`dc\` [opcional]: La dificultad del rol.
       - \`iterations\` [opcional]: El número de veces que se repite el rol.
       - \`advantage\` [opcional]: Si la tirada es con ventaja o desventaja (*El numero de dados debe ser 2*).
  
  5. 📊 **/rollstats** - Genera stats para tu próximo personaje (o te manda a point buy).
  
  =======
  `;
  await interaction.reply(helpMessage);
}
