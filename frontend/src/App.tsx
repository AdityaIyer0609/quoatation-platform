import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import {
  CustomerPortalRoute,
  GuestRoute,
  StaffPortalRoute,
  StaffRoleRoute,
} from "@/components/layout/RouteGuards"
import { AuthProvider } from "@/hooks/useAuth"
import { QuoteDraftProvider } from "@/hooks/useQuoteDraft"
import { CustomerLayout } from "@/layouts/CustomerLayout"
import { SalesLayout } from "@/layouts/SalesLayout"
import Dashboard from "@/pages/Dashboard"
import Login from "@/pages/Login"
import MyQuotes from "@/pages/MyQuotes"
import NewQuote from "@/pages/NewQuote"
import BomReport from "@/pages/BomReport"
import Profile from "@/pages/Profile"
import QuoteDetails from "@/pages/QuoteDetails"
import QuoteReady from "@/pages/QuoteReady"
import ReviewQuote from "@/pages/ReviewQuote"
import SalesDashboard from "@/pages/sales/SalesDashboard"
import SalesCustomers from "@/pages/sales/SalesCustomers"
import SalesCustomerDetail from "@/pages/sales/SalesCustomerDetail"
import SalesCustomerNew from "@/pages/sales/SalesCustomerNew"
import SalesQuotes from "@/pages/sales/SalesQuotes"
import SalesQuoteDetail from "@/pages/sales/SalesQuoteDetail"
import SalesApprovals from "@/pages/sales/SalesApprovals"
import AdminUsers from "@/pages/sales/AdminUsers"
import SalesNewQuote from "@/pages/sales/SalesNewQuote"
import SalesProfile from "@/pages/sales/SalesProfile"

export default function App() {
  return (
    <div className="brand-app h-full">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/" element={<Login />} />
            </Route>
            <Route element={<CustomerPortalRoute />}>
              <Route
                element={
                  <QuoteDraftProvider>
                    <CustomerLayout />
                  </QuoteDraftProvider>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/quotes" element={<MyQuotes />} />
                <Route path="/quotes/new" element={<NewQuote />} />
                <Route path="/quotes/new/review" element={<ReviewQuote />} />
                <Route path="/quotes/new/bom" element={<BomReport />} />
                <Route path="/quotes/:id/ready" element={<QuoteReady />} />
                <Route path="/quotes/:id" element={<QuoteDetails />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>
            <Route element={<StaffPortalRoute />}>
              <Route
                element={
                  <QuoteDraftProvider>
                    <SalesLayout />
                  </QuoteDraftProvider>
                }
              >
                <Route path="/sales" element={<SalesDashboard />} />
                <Route path="/sales/profile" element={<SalesProfile />} />
                <Route path="/sales/quotes" element={<SalesQuotes />} />
                <Route path="/sales/quotes/new" element={<SalesNewQuote />} />
                <Route path="/sales/quotes/configure" element={<NewQuote />} />
                <Route path="/sales/quotes/review" element={<ReviewQuote />} />
                <Route path="/sales/quotes/bom" element={<BomReport />} />
                <Route path="/sales/quotes/:id" element={<SalesQuoteDetail />} />
                <Route element={<StaffRoleRoute roles={["sales_executive", "sales_manager", "admin"]} />}>
                  <Route path="/sales/customers" element={<SalesCustomers />} />
                  <Route path="/sales/customers/new" element={<SalesCustomerNew />} />
                  <Route path="/sales/customers/:id" element={<SalesCustomerDetail />} />
                </Route>
                <Route element={<StaffRoleRoute roles={["pricing_manager", "sales_manager", "admin"]} />}>
                  <Route path="/sales/approvals" element={<SalesApprovals />} />
                </Route>
                <Route element={<StaffRoleRoute roles={["admin"]} />}>
                  <Route path="/sales/admin/users" element={<AdminUsers />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  )
}
