import { useMemo, useState } from "react";
import { Customer } from "../../types";

const useCustomerSearch = (customers: Customer[]) => {
  console.log("🚀 ~ useCustomerSearch ~ customers:", customers);
  const [searchTerm, setSearchTerm] = useState("");
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  return { searchTerm, setSearchTerm, filtered } as const;
};

export default useCustomerSearch;
