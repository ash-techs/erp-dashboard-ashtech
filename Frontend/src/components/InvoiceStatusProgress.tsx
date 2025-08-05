
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { invoicesAPI } from '../services/invoicesAPI';
import { Invoice } from '@/types';

interface InvoiceStatusProgressProps {
  companyId: string;
}

interface StatusCount {
  paid: number;
  pending: number;
  overdue: number;
  draft: number;
  unpaid: number;
  partially: number;
}

const InvoiceStatusProgress: React.FC<InvoiceStatusProgressProps> = ({ companyId }) => {
  const [statusCounts, setStatusCounts] = useState<StatusCount>({
    paid: 0,
    pending: 0,
    overdue: 0,
    draft: 0,
    unpaid: 0,
    partially: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const invoices = await invoicesAPI.getInvoices(companyId);
        const counts: StatusCount = {
          paid: 0,
          pending: 0,
          overdue: 0,
          draft: 0,
          unpaid: 0,
          partially: 0,
        };

        (Array.isArray(invoices) ? invoices : []).forEach((invoice: Invoice) => {
          const status = invoice.status?.toLowerCase();
          if (status && status in counts) {
            counts[status as keyof StatusCount]++;
          }
        });

        setStatusCounts(counts);
      } catch (err) {
        setError('Failed to load invoice data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
  const getPercentage = (count: number) => (total > 0 ? (count / total) * 100 : 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Status</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="space-y-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{status}</span>
                  <span>{count} ({getPercentage(count).toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      status === 'paid' ? 'bg-green-500' :
                      status === 'pending' ? 'bg-yellow-500' :
                      status === 'overdue' ? 'bg-red-500' :
                      status === 'draft' ? 'bg-gray-500' :
                      status === 'unpaid' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${getPercentage(count)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceStatusProgress;
