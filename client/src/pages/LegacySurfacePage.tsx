import React from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/ui/Layout";
import Card, { CardContent, CardHeader } from "../components/ui/Card";

const surfaceLabels: Record<string, string> = {
  dashboard: "Dashboard",
  ledgers: "Ledgers",
  calendar: "Calendar",
  settings: "Settings",
  tickets: "Tickets / OCR",
};

const LegacySurfacePage: React.FC = () => {
  const { surface = "legacy" } = useParams();
  const label = surfaceLabels[surface] || "Legacy Surface";

  return (
    <Layout currentPage={`legacy-${surface}`}>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{label} (Legacy Boundary)</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            This surface is preserved in the revamp under a controlled legacy boundary while active workflows continue to run on
            modernized routes.
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <li>No capability was removed; this area is retained for controlled migration.</li>
            <li>Core day-to-day operations remain available through active modules.</li>
            <li>Legacy internals are isolated to avoid regressions in the main workflow graph.</li>
          </ul>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link className="text-sm text-[var(--color-primary)] hover:underline" to="/customers">
              Go to Customers
            </Link>
            <Link className="text-sm text-[var(--color-primary)] hover:underline" to="/bookings">
              Go to Bookings
            </Link>
            <Link className="text-sm text-[var(--color-primary)] hover:underline" to="/payments">
              Go to Payments
            </Link>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default LegacySurfacePage;
