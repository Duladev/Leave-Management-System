const sql = require('mssql');

const config = {
    user: 'sa',
    password: '123',
    server: 'DCL-ICT-007',
    database: 'Leave_Management_System',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

let pool = null;

const getPool = async () => {
    if (!pool) {
        pool = await sql.connect(config);
        console.log('Connected to SQL Server');
    }
    return pool;
};

module.exports = {
    sql,
    getPool
};