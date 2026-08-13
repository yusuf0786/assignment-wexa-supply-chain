import 'dotenv/config'; // Loads .env.local automatically
import { driver } from '../src/lib/neo4j';

const suppliers = [
  { id: 'S-1', name: 'Apex Microchips', region: 'APAC', reliabilityScore: 0.98 },
  { id: 'S-2', name: 'Global Foundry', region: 'EMEA', reliabilityScore: 0.95 },
  { id: 'S-3', name: 'Titan Metals', region: 'NA', reliabilityScore: 0.88 },
];

const components = [
  { id: 'C-1', name: 'Silicon Wafer V1', type: 'Microchip' },
  { id: 'C-2', name: 'Transistor Array', type: 'Electronics' },
  { id: 'C-3', name: 'Titanium Casing', type: 'Housing' },
  { id: 'C-4', name: 'Logic Board', type: 'Assembly' },
];

const products = [
  { id: 'P-1', name: 'Enterprise Server X1', category: 'Hardware' },
  { id: 'P-2', name: 'Consumer Laptop Pro', category: 'Electronics' },
];

async function seedDatabase() {
  const session = driver.session();
  try {
    console.log('1. Wiping existing graph data...');
    await session.run('MATCH (n) DETACH DELETE n');

    console.log('2. Inserting nodes...');
    // UNWIND takes our array and executes the CREATE statement for each object
    await session.run(`
      UNWIND $suppliers AS s CREATE (:Supplier {id: s.id, name: s.name, region: s.region, reliabilityScore: s.reliabilityScore})
    `, { suppliers });
    
    await session.run(`
      UNWIND $components AS c CREATE (:Component {id: c.id, name: c.name, type: c.type})
    `, { components });
    
    await session.run(`
      UNWIND $products AS p CREATE (:Product {id: p.id, name: p.name, category: p.category})
    `, { products });

    console.log('3. Wiring relationships (Suppliers -> Components)...');
    await session.run(`
      MATCH (s:Supplier {id: 'S-1'}), (c:Component {id: 'C-1'}) CREATE (s)-[:SUPPLIES {leadTimeDays: 14, cost: 45.00}]->(c);
    `);
    await session.run(`
      MATCH (s:Supplier {id: 'S-2'}), (c:Component {id: 'C-2'}) CREATE (s)-[:SUPPLIES {leadTimeDays: 21, cost: 40.00}]->(c);
    `);
    await session.run(`
      MATCH (s:Supplier {id: 'S-3'}), (c:Component {id: 'C-3'}) CREATE (s)-[:SUPPLIES {leadTimeDays: 7, cost: 120.00}]->(c);
    `);

    console.log('4. Wiring sub-assemblies (Components -> Components)...');
    await session.run(`
      MATCH (c1:Component {id: 'C-1'}), (c4:Component {id: 'C-4'}) CREATE (c1)-[:DEPENDS_ON {quantity: 2}]->(c4);
    `);
    await session.run(`
      MATCH (c2:Component {id: 'C-2'}), (c4:Component {id: 'C-4'}) CREATE (c2)-[:DEPENDS_ON {quantity: 10}]->(c4);
    `);

    console.log('5. Wiring final products (Components -> Products)...');
    await session.run(`
      MATCH (c:Component {id: 'C-3'}), (p:Product {id: 'P-1'}) CREATE (c)-[:USED_IN {quantity: 1}]->(p);
    `);
    await session.run(`
      MATCH (c:Component {id: 'C-4'}), (p:Product {id: 'P-1'}) CREATE (c)-[:USED_IN {quantity: 1}]->(p);
    `);
    await session.run(`
      MATCH (c:Component {id: 'C-3'}), (p:Product {id: 'P-2'}) CREATE (c)-[:USED_IN {quantity: 1}]->(p);
    `);
    await session.run(`
      MATCH (c:Component {id: 'C-4'}), (p:Product {id: 'P-2'}) CREATE (c)-[:USED_IN {quantity: 1}]->(p);
    `);

    console.log('✅ Success: Graph Database seeded!');
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

seedDatabase();