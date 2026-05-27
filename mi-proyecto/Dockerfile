# Etapa 1: Compilación de la app de Angular
FROM node:20 AS build-stage
WORKDIR /app

# Copiar archivos de dependencias y descargarlas
COPY package*.json ./
RUN npm install

# Copiar el resto del código del proyecto de Angular
COPY . .

# Compilar el proyecto para producción (genera la carpeta dist/)
RUN npm run build -- --configuration=production

# Etapa 2: Servidor web de producción ultra ligero
FROM nginx:alpine

# Copiar los archivos compilados de Angular desde la etapa anterior hacia Nginx
# NOTA: Revisa si en Angular 17+ tu compilación se guarda directamente en /app/dist/ 
# o en /app/dist/nombre-de-tu-app/browser y ajusta el origen si es necesario.
COPY --from=build-stage /app/dist/ /usr/share/nginx/html

# Exponer el puerto estándar HTTP
EXPOSE 80

# Arrancar Nginx
CMD ["nginx", "-g", "daemon off;"]