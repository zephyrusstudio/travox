import { ArrowRight, FileBarChart2, Pin } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../design-system/patterns";
import { SearchField } from "../../design-system/primitives";
import { apiRequest } from "../../utils/apiConnector";
import { errorToast } from "../../utils/toasts";
import Card from "../ui/Card";
import Spinner from "../ui/Spinner";
import { ReportCatalogItem, ReportCatalogResponse } from "./reportingTypes";

const CATEGORY_ORDER: ReportCatalogItem["category"][] = [
  "Sales",
  "Customers",
  "Vendors",
  "Transactions",
  "Refunds",
  "Existing",
];

const ReportingCenter: React.FC = () => {
  const [catalog, setCatalog] = useState<ReportCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  React.useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const response = await apiRequest<ReportCatalogResponse>({
          method: "GET",
          url: "/reports/catalog",
        });
        setCatalog(response.data ?? []);
      } catch {
        errorToast("Failed to load report catalog");
        setCatalog([]);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const grouped = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = normalizedSearch
      ? catalog.filter(
          (item) =>
            item.label.toLowerCase().includes(normalizedSearch) ||
            item.description.toLowerCase().includes(normalizedSearch) ||
            item.category.toLowerCase().includes(normalizedSearch)
        )
      : catalog;

    return CATEGORY_ORDER.map((category) => ({
      category,
      items: filtered.filter((item) => item.category === category),
    })).filter((group) => group.items.length > 0);
  }, [catalog, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reporting Center"
        description="Access all accounting-style and operational reports from one place while preserving current Customer/Vendor report behavior."
      />

      <Card className="rounded-2xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 sm:p-5">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Search report by name, category, or description"
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner size="lg" />
        </div>
      ) : grouped.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-300">
            No reports matched your search.
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.category} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                {group.category}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.route)}
                    className="group text-left rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 rounded-lg bg-[var(--color-primary-soft)] p-2 text-[var(--color-primary)]">
                          <FileBarChart2 className="h-4 w-4" />
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {item.label}
                          </h3>
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.existing && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                            Existing
                          </span>
                        )}
                        {item.experimental && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                            Derived
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-300">
                      <span className="inline-flex items-center gap-1">
                        <Pin className="h-3.5 w-3.5" />
                        {item.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[var(--color-primary)]">
                        Open
                        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportingCenter;
