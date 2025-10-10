//TODO: Change this , removed bolt code

export const useApp = () => {
  const context = {
    // User-related mock data
    currentUser: { id: '1', name: 'John Doe', email: 'john@example.com', username: 'John Doe' },
    authUser: { id: '1', name: 'John Doe', email: 'john@example.com', username: 'John Doe' },
    logout: () => console.log('Logout clicked'),
    
    // Mock arrays for components
    logs: [],
    bookings: [],
    customers: [],
    payments: [],
    expenses: [],
    vendors: [],
    
    // Mock function for Dashboard
    getDashboardStats: () => ({
      totalRevenue: 12500000,
      pendingAmount: 875000,
      monthlyExpense: 450000,
      activeBookings: 245
    })
  };
  return context;
};
