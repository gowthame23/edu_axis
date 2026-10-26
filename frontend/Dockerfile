FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install --no-audit --no-fund

COPY . .

ARG VITE_API_URL=http://localhost:5001/api
ARG VITE_SOCKET_URL=http://localhost:5001

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]