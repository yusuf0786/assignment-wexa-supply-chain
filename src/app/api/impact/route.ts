import { NextResponse } from 'next/server';
import { driver } from '../../../lib/neo4j';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supplierId = searchParams.get('supplierId');

  if (!supplierId) {
    return NextResponse.json({ error: 'Missing supplierId parameter' }, { status: 400 });
  }

  const session = driver.session();
  try {
    const result = await session.executeRead(tx =>
      tx.run(
        `
        MATCH (s:Supplier {id: $supplierId})-[:SUPPLIES]->(c:Component)-[:DEPENDS_ON|USED_IN*1..5]->(p:Product)
        RETURN DISTINCT p.id AS productId, p.name AS productName, p.category AS category
        `,
        { supplierId } // Strict requirement: Parameterized queries!
      )
    );

    const products = result.records.map(record => ({
      id: record.get('productId'),
      name: record.get('productName'),
      category: record.get('category'),
    }));

    return NextResponse.json({ affectedProducts: products });
  } catch (error) {
    console.error('Neo4j Query Error:', error);
    return NextResponse.json({ error: 'Failed to fetch impact data' }, { status: 500 });
  } finally {
    await session.close();
  }
}