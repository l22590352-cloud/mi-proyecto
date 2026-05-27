FROM python:3.11-slim

# Instalar dependencias del sistema esenciales para PyODBC y MySQL
RUN apt-get update && apt-get install -y \
    build-essential \
    unixodbc \
    unixodbc-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Descargar, crear la carpeta faltante e instalar el Driver ODBC oficial de MySQL 9.1
RUN curl -sSL https://dev.mysql.com/get/Downloads/Connector-ODBC/9.1/mysql-connector-odbc-9.1.0-linux-glibc2.28-x86-64bit.tar.gz | tar -xzf - -C /tmp \
    && mkdir -p /usr/lib/x86_64-linux-gnu/odbc/ \
    && cp /tmp/mysql-connector-odbc-9.1.0-linux-glibc2.28-x86-64bit/lib/libmyodbc9* /usr/lib/x86_64-linux-gnu/odbc/ \
    && /tmp/mysql-connector-odbc-9.1.0-linux-glibc2.28-x86-64bit/bin/myodbc-installer -a -d -n "MySQL ODBC 9.1 Unicode Driver" -t "DRIVER=/usr/lib/x86_64-linux-gnu/odbc/libmyodbc9w.so;"

# Definir el directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalar las librerías de Python necesarias para tu API
RUN pip install --no-cache-dir flask pyodbc flask-cors

# Copiar todo el contenido de tu carpeta backend local al contenedor
COPY . .

# Exponer el puerto de Flask
EXPOSE 5000

# Comando para arrancar la API
CMD ["python", "app.py"]