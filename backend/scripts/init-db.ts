import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

async function initDatabase() {
  const dbName = process.env.DB_DATABASE || 'seguimiento_universitario';
  const user = process.env.DB_USERNAME || 'root';
  const pass = process.env.DB_PASSWORD || 'root';
  const port = process.env.DB_PORT || '3306';

  const sqlFile = path.join(os.tmpdir(), 'init-db.sql');
  fs.writeFileSync(sqlFile, 'CREATE DATABASE IF NOT EXISTS `' + dbName + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n');

  const mysqlPath = 'C:\\Program Files\\MariaDB 11.5\\bin\\mysql.exe';
  const cmd = '"' + mysqlPath + '" -u ' + user + ' -p' + pass + ' -P ' + port + ' < "' + sqlFile + '"';

  execSync(cmd, { shell: 'cmd.exe' });
  fs.unlinkSync(sqlFile);
  console.log('Base de datos "' + dbName + '" lista');
}

initDatabase().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(
    'No se pudo crear la base de datos: ' + message + '\n' +
    'Creada manualmente con:\n' +
    '  CREATE DATABASE IF NOT EXISTS `' + (process.env.DB_DATABASE || 'seguimiento_universitario') + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;',
  );
  process.exit(1);
});
