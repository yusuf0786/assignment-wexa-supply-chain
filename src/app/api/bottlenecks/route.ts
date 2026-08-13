import { NextResponse } from 'next/server';
import { driver } from '../../../lib/neo4j';

export async function GET() {
  const session = driver.session();
  try {
    const result = await session.executeRead(tx =>
      tx.run(`
        MATCH (c:Component)
        WHERE COUNT { (s:Supplier)-[:SUPPLIES]->(c) } = 1
        MATCH (c)-[:DEPENDS_ON|USED_IN*1..5]->(p:Product)
        RETURN c.name AS bottleneckComponent, p.name AS affectedProduct
      `)
    );

    const bottlenecks = result.records.map(record => ({
      component: record.get('bottleneckComponent'),
      product: record.get('affectedProduct'),
    }));

    return NextResponse.json({ bottlenecks });
  } catch (error) {
    console.error('Neo4j Query Error:', error);
    return NextResponse.json({ error: 'Failed to fetch bottlenecks' }, { status: 500 });
  } finally {
    await session.close();
  }
}