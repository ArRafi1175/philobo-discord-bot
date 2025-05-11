# Philobo - A Discord Quote Bot 🤖✨

Philobo is a Discord bot that shares philosophical and motivational quotes. You can add quotes, filter them, and take quote quizzes!

## Features

- `/quote` – Get a random quote
- `/addquote` – Add a new quote (quote + author + mood)
- `/moods` – List of available moods
- `/authors` – List of available authors
- `/filterquote` – Filter quotes by mood or author
- `/quiz` – Guess the author and earn points
- `/score` – Check your score
- `/help` – Show all commands

## 📁 File Structure
project-root/
│
├── index.js # Main bot code
├── quotes_structured.json # Stored quotes
├── score.json # User quiz scores
├── .env # Token and environment variables (not uploaded)
├── .gitignore # Ignore sensitive files
├── package.json # Project config and dependencies


---

## 🛠️ How to Set Up and Run the Bot

Follow these steps to get Philobo running on your computer:

### 1. 📦 Install Node.js

Make sure you have [Node.js](https://nodejs.org/) installed (version 16 or above).  
You can check by running this in your terminal:

```bash
node -v

```
If it's not installed, download and install it from nodejs.org.

2. 📁 Download the Project
If you're using Git:

git clone https://github.com/ArRafi1175/philobo-discord-bot.git
cd philobo-discord-bot

Or just download the ZIP from GitHub and extract it.

3. 📦 Install Dependencies
In the project folder, open your terminal and run:
npm install

4. 🔐 Add Your Discord Bot Token
Create a file named .env in the root of the project folder.

Inside the .env file, add your bot token like this:
DISCORD_TOKEN=your_bot_token_here

5. ▶️ Start the Bot
Run this command in your terminal:
node index.js

You should see something like:
✅ Logged in as Philobo#1234
✅ Slash commands registered.

Your bot is now running and ready to use in your server!


MADE BY RAIKI
Make sure to give me credit if you plan to use it
