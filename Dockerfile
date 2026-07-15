FROM node:18.20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --production

RUN mkdir -p uploads

COPY middleware middleware/
COPY models models/
COPY modules modules/
COPY routes routes/
COPY config config/
COPY socket.js socket.js
COPY index.js index.js

CMD ["npm", "start"]