import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { api } from "@/services/api"

export default function SalesNewQuote() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<{ id: string; company: string; email: string }[]>([])
  const [customerId, setCustomerId] = useState(sessionStorage.getItem("quotecraft.salesCustomerId") ?? "")

  useEffect(() => {
    api.salesCustomers().then(setCustomers).catch(() => undefined)
  }, [])

  return (
    <div className="qc-page max-w-md">
      <h1 className="font-heading text-2xl font-bold tracking-tight">Create quotation</h1>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">Choose a customer, then use the existing bag configurator. BOM and Book4 are unchanged.</p>
      <select
        className="mt-6 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm shadow-[var(--shadow)]"
        value={customerId}
        onChange={(event) => setCustomerId(event.target.value)}
      >
        <option value="">Select customer</option>
        {customers.map((item) => (
          <option key={item.id} value={item.id}>{item.company || item.email}</option>
        ))}
      </select>
      <Button
        className="qc-btn mt-4"
        disabled={!customerId}
        onClick={() => {
          sessionStorage.setItem("quotecraft.salesCustomerId", customerId)
          sessionStorage.removeItem("quotecraft.salesReviseQuoteId")
          navigate("/sales/quotes/configure")
        }}
      >
        Continue
      </Button>
    </div>
  )
}
