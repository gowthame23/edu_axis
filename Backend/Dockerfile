FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY package*.json ./

RUN npm install --omit=dev --no-audit --no-fund

COPY . .

RUN mkdir -p uploads/assignments uploads/library uploads/study-materials uploads/submissions uploads/timetables logs

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]