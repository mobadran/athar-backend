import { DatabaseSync } from 'node:sqlite'
const db = new DatabaseSync('./db.sqlite')


// Execute SQL statements from strings
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id            INTEGER   PRIMARY KEY AUTOINCREMENT ,
        name          TEXT                                ,
        email         TEXT      UNIQUE                    ,
        password      TEXT                                ,
        points        INTEGER   NOT NULL    DEFAULT 0                             
    )
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS qr_codes (
        id            INTEGER   PRIMARY KEY AUTOINCREMENT ,
        text          TEXT                                ,
        enabled       BOOLEAN   NOT NULL    DEFAULT 1
    )    
`)

export default db