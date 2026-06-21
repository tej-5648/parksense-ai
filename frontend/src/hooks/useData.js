import { useState, useEffect } from 'react';

export function useData() {
  const [data, setData] = useState({
    violations: null,
    analytics: null,
    hotspots: null,
    temporal: null,
    predictions: null,
    enforcement: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          violationsRes,
          analyticsRes,
          hotspotsRes,
          temporalRes,
          predictionsRes,
          enforcementRes
        ] = await Promise.all([
          fetch('/data/violations_points.json'),
          fetch('/data/analytics_data.json'),
          fetch('/data/hotspots_data.json'),
          fetch('/data/temporal_data.json'),
          fetch('/data/predictions_data.json'),
          fetch('/data/enforcement_data.json')
        ]);

        const [
          violations,
          analytics,
          hotspots,
          temporal,
          predictions,
          enforcement
        ] = await Promise.all([
          violationsRes.json(),
          analyticsRes.json(),
          hotspotsRes.json(),
          temporalRes.json(),
          predictionsRes.json(),
          enforcementRes.json()
        ]);

        setData({
          violations,
          analytics,
          hotspots,
          temporal,
          predictions,
          enforcement,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        setData(prev => ({ ...prev, loading: false, error: error.message }));
      }
    }

    fetchData();
  }, []);

  return data;
}
