import React from "react";
import ExpenseManagement from "../components/expenses/ExpenseManagement";
import Layout from "../components/ui/Layout";

const ExpensesPage: React.FC = () => {
  return (
    <Layout currentPage="expenses">
      <ExpenseManagement />
    </Layout>
  );
};

export default ExpensesPage;
