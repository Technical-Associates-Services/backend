const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Parser } = require('node-sql-parser');
require('dotenv').config();

const adapter = new PrismaPg({ 
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});
const prisma = new PrismaClient({ adapter });
const parser = new Parser();

const DUMP_FILE = path.join(__dirname, '..', 'wwwtascom_admin.sql');

async function main() {
  console.log('Starting standalone SQL dump migration to Supabase (Postgres)...');

  if (!fs.existsSync(DUMP_FILE)) {
    console.error(`Error: SQL dump not found at ${DUMP_FILE}`);
    process.exit(1);
  }

  console.log('Reading SQL dump...');
  const sqlContent = fs.readFileSync(DUMP_FILE, 'utf8');

  // Split by line-starting INSERT INTO to avoid semicolon-in-string issues
  const rawInserts = sqlContent.split(/^INSERT INTO `/gm).slice(1).map(s => 'INSERT INTO `' + s);
  
  const insertStatements = rawInserts.map(chunk => {
      const lastIndex = chunk.lastIndexOf(');');
      if (lastIndex !== -1) {
          return chunk.substring(0, lastIndex + 2);
      }
      return chunk;
  });
  
  console.log(`Found ${insertStatements.length} INSERT statements.`);

  // Parse all inserts into memory mapped by table
  const tableData = {};

  for (const statement of insertStatements) {
    try {
      // node-sql-parser can handle the standard INSERT INTO `table` (...) VALUES (...) syntax
      const ast = parser.astify(statement, { database: 'MySQL' });
      
      // ast could be an array of ASTs if there are multiple statements
      const asts = Array.isArray(ast) ? ast : [ast];
      
      for (const a of asts) {
        if (a.type !== 'insert') continue;
        
        const tableName = a.table[0].table;
        const columns = a.columns;
        
        if (!tableData[tableName]) tableData[tableName] = [];

        let valuesList = [];
        if (Array.isArray(a.values)) {
            valuesList = a.values;
        } else if (a.values && Array.isArray(a.values.values)) {
            valuesList = a.values.values;
        }

        for (const row of valuesList) {
          if (row.type !== 'expr_list') continue;
          
          const rowData = {};
          row.value.forEach((val, idx) => {
            const colName = columns[idx];
            // val.type can be 'string', 'number', 'null', 'bool', etc.
            let value = val.value;
            
            // Handle null
            if (val.type === 'null') {
                value = null;
            }
            
            rowData[colName] = value;
          });
          
          tableData[tableName].push(rowData);
        }
      }
    } catch (err) {
      console.error(`Failed to parse an INSERT statement:`, err.message);
      console.error(statement.substring(0, 100).replace(/\n/g, ' ') + '...');
    }
  }

  // Define tables in FK-respecting order
  const tables = [
    { name: 'users', model: prisma.user },
    { name: 'roles', model: prisma.role },
    { name: 'permissions', model: prisma.permission },
    { name: 'role_has_permissions', model: prisma.roleHasPermission },
    { name: 'model_has_roles', model: prisma.modelHasRole },
    { name: 'model_has_permissions', model: prisma.modelHasPermission },
    { name: 'association_categories', model: prisma.associationCategory },
    { name: 'associations', model: prisma.association },
    { name: 'banners', model: prisma.banner },
    { name: 'blog_categories', model: prisma.blogCategory },
    { name: 'blogs', model: prisma.blog },
    { name: 'brands', model: prisma.brand },
    { name: 'categories', model: prisma.category },
    { name: 'products', model: prisma.product, jsonColumns: ['additionals'] },
    { name: 'product_enquiries', model: prisma.productEnquiry },
    { name: 'product_reviews', model: prisma.productReview },
    { name: 'images', model: prisma.image },
    { name: 'download_files', model: prisma.downloadFile },
    { name: 'contact_forms', model: prisma.contactForm },
    { name: 'faq_types', model: prisma.faqType },
    { name: 'faqs', model: prisma.faq },
    { name: 'solutions', model: prisma.solution, jsonColumns: ['additionals'] },
    { name: 'pages', model: prisma.page },
    { name: 'services', model: prisma.service },
    { name: 'concerns', model: prisma.concern },
    { name: 'subscribers', model: prisma.subscriber },
    { name: 'testimonials', model: prisma.testimonial },
    { name: 'reference_categories', model: prisma.referenceCategory },
    { name: 'references', model: prisma.reference, jsonColumns: ['images'] },
    { name: 'plugins', model: prisma.plugin },
    { name: 'candidates', model: prisma.candidate },
    { name: 'catalogues', model: prisma.catalogue },
    { name: 'job_lists', model: prisma.jobList },
    { name: 'shops', model: prisma.shop }
  ];

  for (const { name, model, jsonColumns } of tables) {
    console.log(`\nMigrating table: ${name}...`);
    const rows = tableData[name];
    
    if (!rows || rows.length === 0) {
      console.log(`- 0 rows found in ${name}, skipping.`);
      continue;
    }

    const formattedRows = rows.map(row => {
      const formatted = { ...row };
      
      // Parse JSON columns
      if (jsonColumns) {
        for (const col of jsonColumns) {
          if (typeof formatted[col] === 'string' && formatted[col].trim() !== '') {
            try {
              // The string is escaped by mysqldump (e.g. \" or \/)
              // node-sql-parser preserves these backslashes.
              // Unescape double-backslashes first, then quotes/slashes.
              const cleanJsonString = formatted[col]
                .replace(/\\\\/g, '\\')
                .replace(/\\'/g, "'")
                .replace(/\\"/g, '"')
                .replace(/\\\//g, '/');
              formatted[col] = JSON.parse(cleanJsonString);
            } catch (e) {
              console.error(`WARNING: could not parse ${col} JSON for ${name} id=${formatted.id || 'unknown'}. Error: ${e.message}. Kept as null.`);
              console.error(`RAW VALUE:`, formatted[col]);
              formatted[col] = null;
            }
          } else if (formatted[col] === '') {
              formatted[col] = null;
          }
        }
      }
      
      // Handle Date fields
      // The sql dump contains string dates like '2021-01-01 10:00:00'
      // We convert them to JS Dates, and nullify invalid zero-dates
      for (const key in formatted) {
        if (typeof formatted[key] === 'string' && /^\d{4}-\d{2}-\d{2}/.test(formatted[key])) {
            const dateStr = formatted[key];
            if (dateStr.startsWith('0000-00-00')) {
                formatted[key] = null;
            } else {
                const parsedDate = new Date(dateStr);
                if (isNaN(parsedDate.getTime())) {
                    formatted[key] = null;
                } else {
                    formatted[key] = parsedDate;
                }
            }
        }
      }
      
      return formatted;
    });

    console.log(`- Inserting ${formattedRows.length} rows into ${name}...`);
    
    try {
      await model.createMany({
        data: formattedRows,
        skipDuplicates: true
      });
      console.log(`- Successfully migrated ${name}.`);
    } catch (err) {
      console.error(`- Error migrating ${name}:`, err.message);
    }
  }

  await prisma.$disconnect();
  console.log('\nMigration complete!');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
