const sql = require('mssql');

const config = {
    user: 'sa',
    password: '123',
    server: /*'DULA-DEV', */'DCL-ICT-007',/*database name*/
    database: 'leave_management_system',
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