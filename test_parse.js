const fs = require('fs');
const path = require('path');
const { Parser } = require('node-sql-parser');

const parser = new Parser();
const DUMP_FILE = path.join(__dirname, '..', 'wwwtascom_admin.sql');

async function main() {
  console.log('Testing SQL parsing logic...');
  const sqlContent = fs.readFileSync(DUMP_FILE, 'utf8');

  // Split by line-starting INSERT INTO to avoid semicolon-in-string issues
  const rawInserts = sqlContent.split(/^INSERT INTO `/gm).slice(1).map(s => 'INSERT INTO `' + s);
  
  // We need to cut off after the statement ends (at the semicolon outside of strings)
  // Actually, we can just pass the whole chunk to the parser?
  // No, the chunk might contain the next CREATE TABLE etc.
  // A safer way is to find the last ");\n" or ");\r\n"
  const insertStatements = rawInserts.map(chunk => {
      const match = chunk.match(/^(.*?;\s*)$/m) || chunk.match(/^(.*?;\r?\n)/s) || chunk.match(/^(.*?;)/s);
      // Wait, if there's a semicolon in a string, the non-greedy match /^(.*?;)/s will fail.
      // Let's just find the last occurrence of ");\n" or just pass the whole chunk to the parser up to the next non-insert SQL?
      // Actually, if we just split by `\nUNLOCK TABLES;\n`, that usually follows an INSERT.
      
      // Let's try splitting by `\nUNLOCK TABLES;` if the dump uses it
      // Let's just use `chunk.substring(0, chunk.lastIndexOf(');') + 2)`
      const lastIndex = chunk.lastIndexOf(');');
      if (lastIndex !== -1) {
          return chunk.substring(0, lastIndex + 2);
      }
      return chunk;
  });

  console.log(`Found ${insertStatements.length} INSERT statements.`);

  const tableData = {};

  for (const statement of insertStatements) {
    try {
      const ast = parser.astify(statement, { database: 'MySQL' });
      const asts = Array.isArray(ast) ? ast : [ast];
      
      for (const a of asts) {
        if (a.type !== 'insert') continue;
        
        const tableName = a.table[0].table;
        if (!tableData[tableName]) tableData[tableName] = [];

        if (tableName === 'association_categories') {
          // console.log("AST for association_categories:", JSON.stringify(a, null, 2));
        }

        let valuesList = [];
        if (Array.isArray(a.values)) {
            valuesList = a.values;
        } else if (a.values && Array.isArray(a.values.values)) {
            valuesList = a.values.values;
        }

        for (const row of valuesList) {
          if (row.type === 'expr_list') {
            tableData[tableName].push(1); // just count
          }
        }
      }
    } catch (err) {
      console.error(`Failed to parse:`, statement.substring(0, 100).replace(/\n/g, ' '));
      console.error(`Error:`, err.message);
    }
  }

  console.log(`\nResults for requested test tables:`);
  console.log(`- association_categories: ${tableData['association_categories'] ? tableData['association_categories'].length : 0} rows found`);
  console.log(`- banners: ${tableData['banners'] ? tableData['banners'].length : 0} rows found`);
}

main();
