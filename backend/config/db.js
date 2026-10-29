// Conexion a la base de datos
const mysql = require('mysql2');

// Los datos de conexion salen del archivo .env
const conexion = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'petrova_erp',
  dateStrings: true
});

conexion.connect((error) => {
  if (error) {
    console.error('Error de conexion', error);
    return;
  }
  console.log('Conectado a MySQL');
});

module.exports = conexion;
