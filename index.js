
require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

const scoreFile = './score.json';
if (!fs.existsSync(scoreFile)) fs.writeFileSync(scoreFile, '{}');

function getUserPoints(userId) {
  const data = JSON.parse(fs.readFileSync(scoreFile, 'utf8'));
  return data[userId] || 0;
}

function addUserPoints(userId, amount) {
  const data = JSON.parse(fs.readFileSync(scoreFile, 'utf8'));
  data[userId] = (data[userId] || 0) + amount;
  fs.writeFileSync(scoreFile, JSON.stringify(data, null, 2));
}

function loadQuotes() {
  try {
    return JSON.parse(fs.readFileSync('./quotes_structured.json', 'utf8'));
  } catch {
    return [];
  }
}

function getRandomQuote(filterFn = () => true, source = []) {
  const filtered = source.filter(filterFn);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function formatQuote(q) {
  return `"${q.text}"\n— *${q.author}*`;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

const commands = [
  new SlashCommandBuilder().setName('help').setDescription('Show help menu'),
  new SlashCommandBuilder().setName('quote').setDescription('Get a random quote'),
  new SlashCommandBuilder().setName('addquote').setDescription('Add a new quote')
    .addStringOption(option => option.setName('quote').setDescription('The quote text').setRequired(true))
    .addStringOption(option => option.setName('author').setDescription('The author of the quote').setRequired(true))
    .addStringOption(option => option.setName('mood').setDescription('Mood (happy, sad, tragic, inspirational)').setRequired(true)),
  new SlashCommandBuilder().setName('moods').setDescription('Get list of available moods'),
  new SlashCommandBuilder().setName('authors').setDescription('Get list of available authors'),
  new SlashCommandBuilder().setName('filterquote').setDescription('Get a quote by mood and/or author')
    .addStringOption(option => option.setName('mood').setDescription('Mood (optional)').setRequired(false))
    .addStringOption(option => option.setName('author').setDescription('Author (optional)').setRequired(false)),
  new SlashCommandBuilder().setName('quiz').setDescription('Guess the author of a random quote'),
  new SlashCommandBuilder().setName('score').setDescription('Check your quote score')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Slash commands registered.');
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
  }

  client.user.setPresence({
    status: 'online',
    activities: [{ name: '✨ type /help 📚 made by Raiki', type: 0 }]
  });
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = interaction.commandName;

  if (cmd === 'quote') {
    const quotes = loadQuotes();
    return interaction.reply(formatQuote(getRandomQuote(() => true, quotes)));
  }

  if (cmd === 'addquote') {
    const quote = interaction.options.getString('quote');
    const author = interaction.options.getString('author');
    const mood = interaction.options.getString('mood').toLowerCase();

    const allowedMoods = ['happy', 'sad', 'tragic', 'inspirational'];
    if (!allowedMoods.includes(mood)) return interaction.reply({ content: `❌ Invalid mood.`, ephemeral: true });
    if (quote.length < 10) return interaction.reply({ content: '❌ Quote too short.', ephemeral: true });
    if (author.length < 2) return interaction.reply({ content: '❌ Author name too short.', ephemeral: true });

    let allQuotes = [];
    try { allQuotes = loadQuotes(); } 
    catch (e) { return interaction.reply({ content: '❌ Read error.', ephemeral: true }); }

    allQuotes.push({ text: quote, author, mood });
    try {
      fs.writeFileSync('./quotes_structured.json', JSON.stringify(allQuotes, null, 2));
      return interaction.reply(`✅ Quote added by **${author}** under *${mood}* mood.`);
    } catch (e) {
      return interaction.reply({ content: '❌ Write error.', ephemeral: true });
    }
  }

  if (cmd === 'moods') return interaction.reply("🎭 **Available Moods to match your soul:**\n`Happy` | `Sad` | `Tragic` | `Inspirational`");

  if (cmd === 'authors') return interaction.reply(
    "📚 **Here are the brilliant minds you can quote from:**\n" +
    "`Aristotle`, `Camus`, `Chekhov`, `Dostoevsky`, `Kafka`,\n" +
    "`Kierkegaard`, `Marcus Aurelius`, `Nietzsche`, `Oscar Wilde`,\n" +
    "`Plato`, `Rumi`, `Sartre`, `Seneca`, `Simone de Beauvoir`,\n" +
    "`Sylvia Plath`, `Thoreau`, `Tolstoy`, `Virginia Woolf`");

  if (cmd === 'filterquote') {
    const mood = interaction.options.getString('mood')?.toLowerCase();
    const author = interaction.options.getString('author')?.toLowerCase();
    const quotes = loadQuotes();
    const quote = getRandomQuote(q => {
      if (mood && q.mood.toLowerCase() !== mood) return false;
      if (author && !q.author.toLowerCase().includes(author)) return false;
      return true;
    }, quotes);
    return interaction.reply(quote ? formatQuote(quote) : `❌ No quote found.`);
  }

  if (cmd === 'quiz') {
    const quotes = loadQuotes();
    const quote = getRandomQuote(() => true, quotes);
    await interaction.reply({
      content: `🧠 **Quiz Time!**\nWho said this?\n\n> *${quote.text}*\n\nType your answer below within 30 seconds.`
    });

    const filter = m => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', msg => {
      if (msg.content.toLowerCase().includes(quote.author.toLowerCase())) {
        addUserPoints(msg.author.id, 5);
        msg.reply(`✅ Correct! +5 points. Total: **${getUserPoints(msg.author.id)}** points.`);
      } else {
        msg.reply(`❌ Incorrect. The correct answer was **${quote.author}**.`);
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.followUp({ content: `⏰ <@${interaction.user.id}> Time’s up! No answer received.` });
      }
    });
  }

  if (cmd === 'score') {
    const points = getUserPoints(interaction.user.id);
    return interaction.reply(`🏅 <@${interaction.user.id}> has **${points}** points!`);
  }

  if (cmd === 'help') {
    return interaction.reply(
      "```\n" +
      "📜 Philobo Help Menu\n" +
      "----------------------------\n" +
      "/quote               - Get a random quote\n" +
      "/moods               - Get list of available moods\n" +
      "/authors             - Get list of available authors\n" +
      "/filterquote         - Get quote by mood and/or author\n" +
      "/addquote            - Add a new quote\n" +
      "/quiz                - Quiz to guess the author\n" +
      "/score               - Check your quiz score\n" +
      "/help                - Show this help menu\n" +
      "----------------------------\n" +
      "```"
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
