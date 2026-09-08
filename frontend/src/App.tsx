import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { GuestRoute, ProtectedRoute } from "@/components/layout/RouteGuards"
import { AuthProvider } from "@/hooks/useAuth"
import { QuoteDraftProvider } from "@/hooks/useQuoteDraft"
import { CustomerLayout } from "@/layouts/CustomerLayout"
import Dashboard from "@/pages/Dashboard"
import Login from "@/pages/Login"
import MyQuotes from "@/pages/MyQuotes"
import NewQuote from "@/pages/NewQuote"
import BomReport from "@/pages/BomReport"
import Profile from "@/pages/Profile"
import QuoteDetails from "@/pages/QuoteDetails"
import QuoteReady from "@/pages/QuoteReady"
import ReviewQuote from "@/pages/ReviewQuote"

export default function App() {
  return (
    <div className="brand-app h-full">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/" element={<Login />} />
            </Route>
            <Route element={<ProtectedRoute />}>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  )
}
