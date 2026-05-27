# config.py
import pyodbc
print(pyodbc.drivers())

def get_connection():
    conn = pyodbc.connect(
        'DRIVER={MySQL ODBC 9.1 Unicode Driver};'
        'SERVER=db-server;'
        'PORT=3306;'
        'DATABASE=pw;'
        'USER=root;'
        'PASSWORD=Gali1105;'
        'OPTION=3;'
        'CHARSET=UTF8MB4;'
    )
    return conn

