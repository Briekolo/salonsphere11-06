# Gebruik een officiële Node.js runtime als parent image
FROM node:18-alpine

# Stel de werkdirectory in de container in
WORKDIR /app

# Kopieer package.json en package-lock.json om dependencies te cachen
COPY package*.json ./

# Installeer de dependencies
RUN npm install

# Kopieer de rest van de applicatiecode
COPY . .

# Maak de poort waarop de app draait beschikbaar
EXPOSE 3000

# Het commando om de ontwikkelserver te starten
CMD ["npm", "run", "dev"] 