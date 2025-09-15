FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package.json /app/package.json
RUN npm install
COPY frontend /app
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Use repo nginx.conf to proxy /api to backend service in docker-compose
COPY deployment/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

