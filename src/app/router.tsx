import { Navigate, createBrowserRouter, type RouteObject } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell/AppShell';
import { CartPage } from '../features/cart/pages/CartPage';
import { OrderSuccessPage } from '../features/checkout/pages/OrderSuccessPage';
import { PaymentPage } from '../features/checkout/pages/PaymentPage';
import { HomePage } from '../features/home/pages/HomePage';
import { NotFoundPage } from '../features/not-found/pages/NotFoundPage';
import { ProductDetailsPage } from '../features/product/pages/ProductDetailsPage';
import { SearchResultsPage } from '../features/search/pages/SearchResultsPage';

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/s', element: <SearchResultsPage /> },
      { path: '/dp/:productId', element: <ProductDetailsPage /> },
      { path: '/gp/cart/view.html', element: <CartPage /> },
      { path: '/cart', element: <Navigate replace to="/gp/cart/view.html" /> },
      { path: '/checkout/payment', element: <PaymentPage /> },
      { path: '/order/success', element: <OrderSuccessPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
