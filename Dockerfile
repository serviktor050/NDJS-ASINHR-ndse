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
COPY index.js index.js

CMD ["npm", "start"]