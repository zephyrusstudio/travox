import React from "react";
import UserManagement from "../components/users/UserManagement";
import Layout from "../components/ui/Layout";

const UsersPage: React.FC = () => {
  return (
    <Layout currentPage="users">
      <UserManagement />
    </Layout>
  );
};

export default UsersPage;
