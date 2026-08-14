const fs = require('fs');
const { Parser } = require('node-sql-parser');
const sql = fs.readFileSync('../wwwtascom_admin.sql', 'utf8');
const inserts = sql.match(/^INSERT INTO `products`.*?;/gms);
if (inserts) {
  const parser = new Parser();
  const ast = parser.astify(inserts[0], { database: 'MySQL' });
  const a = Array.isArray(ast) ? ast[0] : ast;
  const colIdx = a.columns.indexOf('additionals');
  const valuesList = Array.isArray(a.values) ? a.values : a.values.values;
  for (const row of valuesList) {
    if (row.type === 'expr_list') {
      const val = row.value[colIdx].value;
      console.log('additionals type:', typeof val);
      console.log('additionals value:', val);
    }
  }
}
