
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { productsAPI } from '../services/productsAPI';
import { Product } from '@/types';

interface SalesCountCircleProps {
  companyId: string;
}

const SalesCountCircle: React.FC<SalesCountCircleProps> = ({ companyId }) => {
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const products = await productsAPI.getProducts(companyId);
        const total = (Array.isArray(products) ? products : []).reduce((sum, product: Product) => {
          return sum + (product.sale_count || 0);
        }, 0);

        setTotalSales(total);
      } catch (err) {
        setError('Failed to load product sales data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Sales</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-gray-200"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
                <circle
                  className="text-blue-500"
                  strokeWidth="10"
                  strokeDasharray={`${totalSales * 2.51} 251.2`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="text-2xl font-bold">{totalSales}</span>
                <p className="text-sm text-gray-500">Sales</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesCountCircle;
