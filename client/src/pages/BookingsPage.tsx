import React from "react";
import BookingManagement from "../components/bookings/BookingManagement";
import Layout from "../components/ui/Layout";

const BookingsPage: React.FC = () => {
  return (
    <Layout currentPage="bookings">
      <BookingManagement />
    </Layout>
  );
};

export default BookingsPage;
