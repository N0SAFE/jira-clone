#!/usr/bin/env ts-node

import { Command } from 'commander';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import chalk from 'chalk';

// Types for schema elements
interface DirectusSchema {
  version: string;
  directus: string;
  vendor: string;
  collections: Collection[];
  fields: Field[];
  relations: Relation[];
}

interface Collection {
  collection: string;
  meta: CollectionMeta;
  schema: CollectionSchema;
}

interface CollectionMeta {
  [key: string]: any;
}

interface CollectionSchema {
  name: string;
  [key: string]: any;
}

interface Field {
  collection: string;
  field: string;
  type: string;
  meta: FieldMeta;
  schema: FieldSchema;
}

interface FieldMeta {
  [key: string]: any;
}

interface FieldSchema {
  name: string;
  table: string;
  data_type: string;
  [key: string]: any;
}

interface Relation {
  collection: string;
  field: string;
  related_collection: string;
  meta: RelationMeta;
  schema: RelationSchema;
}

interface RelationMeta {
  [key: string]: any;
}

interface RelationSchema {
  [key: string]: any;
}

// Migration types
interface MigrationOperation {
  type: 'create' | 'update' | 'delete';
  entity: 'collection' | 'field' | 'relation';
  details: any;
}

// Helper function to compare objects and find differences
function getObjectDifferences(obj1: any, obj2: any, path: string = ''): { path: string; oldValue: any; newValue: any }[] {
  if (!obj1 || !obj2) {
    return [{ path, oldValue: obj1, newValue: obj2 }];
  }

  const differences: { path: string; oldValue: any; newValue: any }[] = [];
  
  // Check properties in obj1
  for (const key in obj1) {
    const newPath = path ? `${path}.${key}` : key;
    
    if (!(key in obj2)) {
      differences.push({ path: newPath, oldValue: obj1[key], newValue: undefined });
      continue;
    }
    
    if (typeof obj1[key] === 'object' && obj1[key] !== null && 
        typeof obj2[key] === 'object' && obj2[key] !== null) {
      differences.push(...getObjectDifferences(obj1[key], obj2[key], newPath));
    } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
      differences.push({ path: newPath, oldValue: obj1[key], newValue: obj2[key] });
    }
  }
  
  // Check for properties in obj2 that aren't in obj1
  for (const key in obj2) {
    if (!(key in obj1)) {
      const newPath = path ? `${path}.${key}` : key;
      differences.push({ path: newPath, oldValue: undefined, newValue: obj2[key] });
    }
  }
  
  return differences;
}

function compareSchemas(oldSchema: DirectusSchema, newSchema: DirectusSchema): MigrationOperation[] {
  const migrations: MigrationOperation[] = [];
  
  // Compare collections
  const oldCollections = new Map(oldSchema.collections.map(c => [c.collection, c]));
  const newCollections = new Map(newSchema.collections.map(c => [c.collection, c]));
  
  // Find new collections
  for (const [name, collection] of newCollections.entries()) {
    if (!oldCollections.has(name)) {
      migrations.push({
        type: 'create',
        entity: 'collection',
        details: collection
      });
    }
  }
  
  // Find updated collections
  for (const [name, oldCollection] of oldCollections.entries()) {
    if (newCollections.has(name)) {
      const newCollection = newCollections.get(name)!;
      const differences = getObjectDifferences(oldCollection.meta, newCollection.meta);
      if (differences.length > 0) {
        migrations.push({
          type: 'update',
          entity: 'collection',
          details: {
            collection: name,
            meta: newCollection.meta,
            differences
          }
        });
      }
    }
  }
  
  // Find deleted collections
  for (const [name, collection] of oldCollections.entries()) {
    if (!newCollections.has(name)) {
      migrations.push({
        type: 'delete',
        entity: 'collection',
        details: collection
      });
    }
  }
  
  // Compare fields
  const oldFields = new Map(oldSchema.fields.map(f => [`${f.collection}.${f.field}`, f]));
  const newFields = new Map(newSchema.fields.map(f => [`${f.collection}.${f.field}`, f]));
  
  // Find new fields
  for (const [key, field] of newFields.entries()) {
    if (!oldFields.has(key)) {
      migrations.push({
        type: 'create',
        entity: 'field',
        details: field
      });
    }
  }
  
  // Find updated fields
  for (const [key, oldField] of oldFields.entries()) {
    if (newFields.has(key)) {
      const newField = newFields.get(key)!;
      const metaDifferences = getObjectDifferences(oldField.meta, newField.meta);
      const schemaDifferences = getObjectDifferences(oldField.schema, newField.schema);
      
      if (metaDifferences.length > 0 || schemaDifferences.length > 0 || oldField.type !== newField.type) {
        migrations.push({
          type: 'update',
          entity: 'field',
          details: {
            collection: oldField.collection,
            field: oldField.field,
            typeChanged: oldField.type !== newField.type,
            oldType: oldField.type,
            newType: newField.type,
            meta: newField.meta,
            schema: newField.schema,
            metaDifferences,
            schemaDifferences
          }
        });
      }
    }
  }
  
  // Find deleted fields
  for (const [key, field] of oldFields.entries()) {
    if (!newFields.has(key)) {
      migrations.push({
        type: 'delete',
        entity: 'field',
        details: field
      });
    }
  }
  
  // Compare relations
  const oldRelations = new Map(oldSchema.relations.map(r => [`${r.collection}.${r.field}`, r]));
  const newRelations = new Map(newSchema.relations.map(r => [`${r.collection}.${r.field}`, r]));
  
  // Find new relations
  for (const [key, relation] of newRelations.entries()) {
    if (!oldRelations.has(key)) {
      migrations.push({
        type: 'create',
        entity: 'relation',
        details: relation
      });
    }
  }
  
  // Find updated relations
  for (const [key, oldRelation] of oldRelations.entries()) {
    if (newRelations.has(key)) {
      const newRelation = newRelations.get(key)!;
      const metaDifferences = getObjectDifferences(oldRelation.meta, newRelation.meta);
      const schemaDifferences = getObjectDifferences(oldRelation.schema, newRelation.schema);
      
      if (metaDifferences.length > 0 || schemaDifferences.length > 0 || 
          oldRelation.related_collection !== newRelation.related_collection) {
        migrations.push({
          type: 'update',
          entity: 'relation',
          details: {
            collection: oldRelation.collection,
            field: oldRelation.field,
            oldRelatedCollection: oldRelation.related_collection,
            newRelatedCollection: newRelation.related_collection,
            meta: newRelation.meta,
            schema: newRelation.schema,
            metaDifferences,
            schemaDifferences
          }
        });
      }
    }
  }
  
  // Find deleted relations
  for (const [key, relation] of oldRelations.entries()) {
    if (!newRelations.has(key)) {
      migrations.push({
        type: 'delete',
        entity: 'relation',
        details: relation
      });
    }
  }
  
  return migrations;
}

function generateMigrationCode(operations: MigrationOperation[], options: { url: string }): string {
  const migrationTime = new Date().toISOString().replace(/[:.]/g, '-');
  const migrationName = `migration_${migrationTime}`;
  
  const migrationCode = `
// Migration generated on ${new Date().toISOString()}
import { createTypedClient, staticToken } from '@repo/directus-sdk';

// This migration was automatically generated. 
// Please review before running.

export async function up(options: { url: string, token: string }) {
  console.log(chalk.blue('Running migration up...'));
  const client = createTypedClient(options.url).with(staticToken(options.token));
  
  try {
    ${generateUpMigrationCode(operations)}
    
    console.log(chalk.green('Migration completed successfully'));
  } catch (error) {
    console.error(chalk.red('Migration failed:'), error);
    throw error;
  }
}

export async function down(options: { url: string, token: string }) {
  console.log(chalk.blue('Running migration down...'));
  const client = createTypedClient(options.url).with(staticToken(options.token));
  
  try {
    ${generateDownMigrationCode(operations)}
    
    console.log(chalk.green('Rollback completed successfully'));
  } catch (error) {
    console.error(chalk.red('Rollback failed:'), error);
    throw error;
  }
}
`;

  return migrationCode;
}

function generateUpMigrationCode(operations: MigrationOperation[]): string {
  const codeBlocks: string[] = [];
  
  // Process operations in the correct order to avoid dependency issues
  // First create collections, then fields, then relations
  const createCollections = operations.filter(op => op.type === 'create' && op.entity === 'collection');
  const createFields = operations.filter(op => op.type === 'create' && op.entity === 'field');
  const createRelations = operations.filter(op => op.type === 'create' && op.entity === 'relation');
  
  // Then handle updates
  const updateCollections = operations.filter(op => op.type === 'update' && op.entity === 'collection');
  const updateFields = operations.filter(op => op.type === 'update' && op.entity === 'field');
  const updateRelations = operations.filter(op => op.type === 'update' && op.entity === 'relation');
  
  // Finally handle deletions in reverse order
  const deleteRelations = operations.filter(op => op.type === 'delete' && op.entity === 'relation');
  const deleteFields = operations.filter(op => op.type === 'delete' && op.entity === 'field');
  const deleteCollections = operations.filter(op => op.type === 'delete' && op.entity === 'collection');
  
  // Create collections
  if (createCollections.length > 0) {
    codeBlocks.push(`
    // Create collections
    console.log(chalk.yellow('Creating collections...'));
    ${createCollections.map(op => {
      const collection = op.details;
      return `
    // Create collection: ${collection.collection}
    await client.request(() => ({
      method: 'POST',
      path: '/collections',
      body: JSON.stringify({
        collection: ${JSON.stringify(collection.collection)},
        meta: ${JSON.stringify(collection.meta)},
        schema: ${JSON.stringify(collection.schema)}
      })
    }));
    console.log(chalk.green('Created collection: ${collection.collection}'));`;
    }).join('\n')}
    `);
  }
  
  // Create fields
  if (createFields.length > 0) {
    codeBlocks.push(`
    // Create fields
    console.log(chalk.yellow('Creating fields...'));
    ${createFields.map(op => {
      const field = op.details;
      return `
    // Create field: ${field.collection}.${field.field}
    await client.request(() => ({
      method: 'POST',
      path: '/fields',
      body: JSON.stringify({
        collection: ${JSON.stringify(field.collection)},
        field: ${JSON.stringify(field.field)},
        type: ${JSON.stringify(field.type)},
        meta: ${JSON.stringify(field.meta)},
        schema: ${JSON.stringify(field.schema)}
      })
    }));
    console.log(chalk.green('Created field: ${field.collection}.${field.field}'));`;
    }).join('\n')}
    `);
  }
  
  // Create relations
  if (createRelations.length > 0) {
    codeBlocks.push(`
    // Create relations
    console.log(chalk.yellow('Creating relations...'));
    ${createRelations.map(op => {
      const relation = op.details;
      return `
    // Create relation: ${relation.collection}.${relation.field} -> ${relation.related_collection}
    await client.request(() => ({
      method: 'POST',
      path: '/relations',
      body: JSON.stringify({
        collection: ${JSON.stringify(relation.collection)},
        field: ${JSON.stringify(relation.field)},
        related_collection: ${JSON.stringify(relation.related_collection)},
        meta: ${JSON.stringify(relation.meta)},
        schema: ${JSON.stringify(relation.schema)}
      })
    }));
    console.log(chalk.green('Created relation: ${relation.collection}.${relation.field} -> ${relation.related_collection}'));`;
    }).join('\n')}
    `);
  }
  
  // Update collections
  if (updateCollections.length > 0) {
    codeBlocks.push(`
    // Update collections
    console.log(chalk.yellow('Updating collections...'));
    ${updateCollections.map(op => {
      const details = op.details;
      return `
    // Update collection: ${details.collection}
    await client.request(() => ({
      method: 'PATCH',
      path: '/collections/${details.collection}',
      body: JSON.stringify({
        meta: ${JSON.stringify(details.meta)}
      })
    }));
    console.log(chalk.green('Updated collection: ${details.collection}'));`;
    }).join('\n')}
    `);
  }
  
  // Update fields
  if (updateFields.length > 0) {
    codeBlocks.push(`
    // Update fields
    console.log(chalk.yellow('Updating fields...'));
    ${updateFields.map(op => {
      const details = op.details;
      return `
    // Update field: ${details.collection}.${details.field}
    await client.request(() => ({
      method: 'PATCH',
      path: '/fields/${details.collection}/${details.field}',
      body: JSON.stringify({
        type: ${JSON.stringify(details.newType)},
        meta: ${JSON.stringify(details.meta)},
        schema: ${JSON.stringify(details.schema)}
      })
    }));
    console.log(chalk.green('Updated field: ${details.collection}.${details.field}'));`;
    }).join('\n')}
    `);
  }
  
  // Update relations
  if (updateRelations.length > 0) {
    codeBlocks.push(`
    // Update relations
    console.log(chalk.yellow('Updating relations...'));
    ${updateRelations.map(op => {
      const details = op.details;
      return `
    // Update relation: ${details.collection}.${details.field} -> ${details.newRelatedCollection}
    await client.request(() => ({
      method: 'PATCH',
      path: '/relations/${details.collection}/${details.field}',
      body: JSON.stringify({
        related_collection: ${JSON.stringify(details.newRelatedCollection)},
        meta: ${JSON.stringify(details.meta)},
        schema: ${JSON.stringify(details.schema)}
      })
    }));
    console.log(chalk.green('Updated relation: ${details.collection}.${details.field} -> ${details.newRelatedCollection}'));`;
    }).join('\n')}
    `);
  }
  
  // Delete relations
  if (deleteRelations.length > 0) {
    codeBlocks.push(`
    // Delete relations
    console.log(chalk.yellow('Deleting relations...'));
    ${deleteRelations.map(op => {
      const relation = op.details;
      return `
    // Delete relation: ${relation.collection}.${relation.field}
    await client.request(() => ({
      method: 'DELETE',
      path: '/relations/${relation.collection}/${relation.field}'
    }));
    console.log(chalk.green('Deleted relation: ${relation.collection}.${relation.field}'));`;
    }).join('\n')}
    `);
  }
  
  // Delete fields
  if (deleteFields.length > 0) {
    codeBlocks.push(`
    // Delete fields
    console.log(chalk.yellow('Deleting fields...'));
    ${deleteFields.map(op => {
      const field = op.details;
      return `
    // Delete field: ${field.collection}.${field.field}
    await client.request(() => ({
      method: 'DELETE',
      path: '/fields/${field.collection}/${field.field}'
    }));
    console.log(chalk.green('Deleted field: ${field.collection}.${field.field}'));`;
    }).join('\n')}
    `);
  }
  
  // Delete collections
  if (deleteCollections.length > 0) {
    codeBlocks.push(`
    // Delete collections
    console.log(chalk.yellow('Deleting collections...'));
    ${deleteCollections.map(op => {
      const collection = op.details;
      return `
    // Delete collection: ${collection.collection}
    await client.request(() => ({
      method: 'DELETE',
      path: '/collections/${collection.collection}'
    }));
    console.log(chalk.green('Deleted collection: ${collection.collection}'));`;
    }).join('\n')}
    `);
  }
  
  return codeBlocks.join('\n\n');
}

function generateDownMigrationCode(operations: MigrationOperation[]): string {
  const codeBlocks: string[] = [];
  
  // Process operations in reverse order
  // First delete relations, then fields, then collections
  const deleteRelations = operations.filter(op => op.type === 'create' && op.entity === 'relation');
  const deleteFields = operations.filter(op => op.type === 'create' && op.entity === 'field');
  const deleteCollections = operations.filter(op => op.type === 'create' && op.entity === 'collection');
  
  // Delete relations (created in up)
  if (deleteRelations.length > 0) {
    codeBlocks.push(`
    // Delete relations
    console.log(chalk.yellow('Deleting relations...'));
    ${deleteRelations.map(op => {
      const relation = op.details;
      return `
    // Delete relation: ${relation.collection}.${relation.field} -> ${relation.related_collection}
    await client.request(() => ({
      method: 'DELETE',
      path: '/relations/${relation.collection}/${relation.field}'
    }));
    console.log(chalk.green('Deleted relation: ${relation.collection}.${relation.field} -> ${relation.related_collection}'));`;
    }).join('\n')}
    `);
  }
  
  // Delete fields (created in up)
  if (deleteFields.length > 0) {
    codeBlocks.push(`
    // Delete fields
    console.log(chalk.yellow('Deleting fields...'));
    ${deleteFields.map(op => {
      const field = op.details;
      return `
    // Delete field: ${field.collection}.${field.field}
    await client.request(() => ({
      method: 'DELETE',
      path: '/fields/${field.collection}/${field.field}'
    }));
    console.log(chalk.green('Deleted field: ${field.collection}.${field.field}'));`;
    }).join('\n')}
    `);
  }
  
  // Delete collections (created in up)
  if (deleteCollections.length > 0) {
    codeBlocks.push(`
    // Delete collections
    console.log(chalk.yellow('Deleting collections...'));
    ${deleteCollections.map(op => {
      const collection = op.details;
      return `
    // Delete collection: ${collection.collection}
    await client.request(() => ({
      method: 'DELETE',
      path: '/collections/${collection.collection}'
    }));
    console.log(chalk.green('Deleted collection: ${collection.collection}'));`;
    }).join('\n')}
    `);
  }
  
  // Handle recreating deleted items
  const createCollections = operations.filter(op => op.type === 'delete' && op.entity === 'collection');
  if (createCollections.length > 0) {
    codeBlocks.push(`
    // Recreate deleted collections
    console.log(chalk.yellow('Recreating deleted collections...'));
    ${createCollections.map(op => {
      const collection = op.details;
      return `
    // Recreate collection: ${collection.collection}
    await client.request(() => ({
      method: 'POST',
      path: '/collections',
      body: JSON.stringify({
        collection: ${JSON.stringify(collection.collection)},
        meta: ${JSON.stringify(collection.meta)},
        schema: ${JSON.stringify(collection.schema)}
      })
    }));
    console.log(chalk.green('Recreated collection: ${collection.collection}'));`;
    }).join('\n')}
    `);
  }

  const createFields = operations.filter(op => op.type === 'delete' && op.entity === 'field');
  if (createFields.length > 0) {
    codeBlocks.push(`
    // Recreate deleted fields
    console.log(chalk.yellow('Recreating deleted fields...'));
    ${createFields.map(op => {
      const field = op.details;
      return `
    // Recreate field: ${field.collection}.${field.field}
    await client.request(() => ({
      method: 'POST',
      path: '/fields',
      body: JSON.stringify({
        collection: ${JSON.stringify(field.collection)},
        field: ${JSON.stringify(field.field)},
        type: ${JSON.stringify(field.type)},
        meta: ${JSON.stringify(field.meta)},
        schema: ${JSON.stringify(field.schema)}
      })
    }));
    console.log(chalk.green('Recreated field: ${field.collection}.${field.field}'));`;
    }).join('\n')}
    `);
  }

  const createRelations = operations.filter(op => op.type === 'delete' && op.entity === 'relation');
  if (createRelations.length > 0) {
    codeBlocks.push(`
    // Recreate deleted relations
    console.log(chalk.yellow('Recreating deleted relations...'));
    ${createRelations.map(op => {
      const relation = op.details;
      return `
    // Recreate relation: ${relation.collection}.${relation.field} -> ${relation.related_collection}
    await client.request(() => ({
      method: 'POST',
      path: '/relations',
      body: JSON.stringify({
        collection: ${JSON.stringify(relation.collection)},
        field: ${JSON.stringify(relation.field)},
        related_collection: ${JSON.stringify(relation.related_collection)},
        meta: ${JSON.stringify(relation.meta)},
        schema: ${JSON.stringify(relation.schema)}
      })
    }));
    console.log(chalk.green('Recreated relation: ${relation.collection}.${relation.field} -> ${relation.related_collection}'));`;
    }).join('\n')}
    `);
  }
  
  return codeBlocks.join('\n\n');
}

// Create command line interface
const program = new Command();

program
  .name('migrate')
  .description('Generate migrations between two Directus schema YAML snapshots')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate a migration file from two schema snapshots')
  .requiredOption('-o, --old <path>', 'Path to the old schema snapshot YAML file')
  .requiredOption('-n, --new <path>', 'Path to the new schema snapshot YAML file')
  .option('-u, --url <url>', 'Directus URL for API calls', 'http://localhost:8055')
  .option('-d, --dir <path>', 'Directory to save the migration file', './migrations')
  .action(async (options) => {
    try {
      console.log(chalk.blue(`Comparing schemas: ${options.old} -> ${options.new}`));
      
      // Read and parse YAML files
      const oldSchemaYaml = fs.readFileSync(options.old, 'utf8');
      const newSchemaYaml = fs.readFileSync(options.new, 'utf8');
      
      const oldSchema = yaml.load(oldSchemaYaml) as DirectusSchema;
      const newSchema = yaml.load(newSchemaYaml) as DirectusSchema;
      
      // Compare schemas and generate migrations
      const operations = compareSchemas(oldSchema, newSchema);
      
      if (operations.length === 0) {
        console.log(chalk.green('No schema changes detected.'));
        return;
      }
      
      console.log(chalk.yellow(`Detected ${operations.length} changes:`));
      operations.forEach((op, i) => {
        const entityName = op.entity === 'collection' 
          ? op.details.collection 
          : `${op.details.collection}.${op.details.field}`;
        console.log(`  ${i + 1}. ${op.type} ${op.entity} ${entityName}`);
      });
      
      // Generate migration code
      const migrationCode = generateMigrationCode(operations, { url: options.url });
      
      // Ensure migrations directory exists
      if (!fs.existsSync(options.dir)) {
        fs.mkdirSync(options.dir, { recursive: true });
      }
      
      // Save migration file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = path.join(options.dir, `migration-${timestamp}.ts`);
      fs.writeFileSync(filename, migrationCode);
      
      console.log(chalk.green(`Migration file created: ${filename}`));
    } catch (error) {
      console.error(chalk.red('Failed to generate migration:'), error);
      process.exit(1);
    }
  });

program
  .command('run')
  .description('Run a specific migration')
  .requiredOption('-f, --file <path>', 'Path to the migration file')
  .requiredOption('-t, --token <token>', 'Directus admin token')
  .option('-u, --url <url>', 'Directus URL', 'http://localhost:8055')
  .option('-d, --down', 'Run the down migration instead of up', false)
  .action(async (options) => {
    try {
      const migrationPath = path.resolve(options.file);
      console.log(chalk.blue(`Running migration: ${migrationPath}`));
      
      // Import the migration dynamically
      const migration = await import(migrationPath);
      
      // Run the migration
      if (options.down) {
        await migration.down({ url: options.url, token: options.token });
      } else {
        await migration.up({ url: options.url, token: options.token });
      }
      
      console.log(chalk.green('Migration completed successfully!'));
    } catch (error) {
      console.error(chalk.red('Failed to run migration:'), error);
      process.exit(1);
    }
  });

program.parse(process.argv);