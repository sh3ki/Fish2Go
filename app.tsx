import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

const AdminDashboard = lazy(() => import('./resources/js/pages/admin_dashboard.tsx'));
const AdminInventory = lazy(() => import('./resources/js/pages/admin_inventory.tsx'));
const AdminOrders = lazy(() => import('./resources/js/pages/admin_orders.tsx'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Switch>
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/inventory" component={AdminInventory} />
          <Route path="/admin/orders" component={AdminOrders} />
        </Switch>
      </Suspense>
    </Router>
  );
}

export default App;