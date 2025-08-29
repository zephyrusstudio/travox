import { useMemo, useState } from "react";
import { Customer } from "../../types";

const useCustomerSearch = (customers: Customer[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  return { searchTerm, setSearchTerm, filtered } as const;
};

export default useCustomerSearch;
