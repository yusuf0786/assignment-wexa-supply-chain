'use client';

import { useState, useEffect } from 'react';

// Types to keep TypeScript happy
type Product = { id: string; name: string; category: string };
type Bottleneck = { component: string; product: string };

export default function Dashboard() {
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  
  // State for Blast Radius simulation
  const [impactData, setImpactData] = useState<Product[] | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  // State for Bottlenecks
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
  const [isLoadingBottlenecks, setIsLoadingBottlenecks] = useState(true);

  // Fetch bottlenecks immediately on load
  useEffect(() => {
    fetch('/api/bottlenecks')
      .then(res => res.json())
      .then(data => {
        setBottlenecks(data.bottlenecks || []);
        setIsLoadingBottlenecks(false);
      })
      .catch(() => {
        setIsLoadingBottlenecks(false);
      });
  }, []);

  const runSimulation = async () => {
    if (!selectedSupplier) return;
    
    setIsSimulating(true);
    setSimError(null);
    setImpactData(null);

    try {
      const res = await fetch(`/api/impact?supplierId=${selectedSupplier}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      setImpactData(data.affectedProducts);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setSimError('The database is currently unreachable. Please try again later.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Supply Chain Risk Analyzer</h1>
          <p className="text-gray-500 mt-2">
            Powered by CognoDB. Discover hidden vulnerabilities across multi-tier dependencies.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Simulation Area */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4">Simulate Supplier Failure</h2>
              <div className="flex gap-4">
                <select 
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                >
                  <option value="" disabled>Select a supplier...</option>
                  <option value="S-1">Apex Microchips (APAC)</option>
                  <option value="S-2">Global Foundry (EMEA)</option>
                  <option value="S-3">Titan Metals (NA)</option>
                </select>
                <button 
                  onClick={runSimulation}
                  disabled={!selectedSupplier || isSimulating}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                  {isSimulating ? 'Analyzing Graph...' : 'Run Simulation'}
                </button>
              </div>
            </div>

            {/* Results Area */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-62.5">
              <h2 className="text-xl font-semibold mb-4">Blast Radius (Affected Products)</h2>
              
              {/* Empty State */}
              {!impactData && !isSimulating && !simError && (
                <div className="flex items-center justify-center h-40 text-gray-400">
                  Select a supplier and run the simulation to see downstream impacts.
                </div>
              )}

              {/* Loading State */}
              {isSimulating && (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}

              {/* Error State */}
              {simError && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                  {simError}
                </div>
              )}

              {/* Success State */}
              {impactData && (
                <div className="space-y-3">
                  {impactData.length === 0 ? (
                    <p className="text-green-600">No end products are affected by this supplier.</p>
                  ) : (
                    impactData.map((product) => (
                      <div key={product.id} className="flex justify-between p-4 bg-gray-50 border border-gray-100 rounded-lg">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-sm bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          {product.category}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar / Insights */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-semibold mb-4">Structural Bottlenecks</h2>
            <p className="text-sm text-gray-500 mb-4">
              Components supplied by exactly ONE vendor globally.
            </p>

            {isLoadingBottlenecks ? (
              <div className="animate-pulse space-y-3">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ) : bottlenecks.length > 0 ? (
              <ul className="space-y-3">
                {bottlenecks.map((b, i) => (
                  <li key={i} className="text-sm p-3 bg-orange-50 text-orange-900 border border-orange-100 rounded-lg">
                    <span className="font-semibold block">{b.component}</span>
                    <span className="text-orange-700">Used in: {b.product}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-green-600 text-sm">No critical bottlenecks found.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}