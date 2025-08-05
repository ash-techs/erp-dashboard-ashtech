
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { quotesAPI } from '../services/quotesAPI';
import { Quote } from '@/types';

interface QuoteStatusProgressProps {
  companyId: string;
}

interface StatusCount {
  accepted: number;
  pending: number;
  rejected: number;
  draft: number;
}

const QuoteStatusProgress: React.FC<QuoteStatusProgressProps> = ({ companyId }) => {
  const [statusCounts, setStatusCounts] = useState<StatusCount>({
    accepted: 0,
    pending: 0,
    rejected: 0,
    draft: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const quotes = await quotesAPI.getQuotes(companyId);
        const counts: StatusCount = {
          accepted: 0,
          pending: 0,
          rejected: 0,
          draft: 0,
        };

        (Array.isArray(quotes) ? quotes : []).forEach((quote: Quote) => {
          const status = quote.status?.toLowerCase();
          if (status && status in counts) {
            counts[status as keyof StatusCount]++;
          }
        });

        setStatusCounts(counts);
      } catch (err) {
        setError('Failed to load quote data.');
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
        <CardTitle>Quote Status</CardTitle>
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
                      status === 'accepted' ? 'bg-green-500' :
                      status === 'pending' ? 'bg-yellow-500' :
                      status === 'rejected' ? 'bg-red-500' :
                      'bg-gray-500'
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

export default QuoteStatusProgress;
