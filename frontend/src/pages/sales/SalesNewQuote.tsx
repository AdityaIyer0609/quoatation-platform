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
    <div className="mx-auto max-w-md p-6 md:p-8">
      <h1 className="font-heading text-xl font-bold">Create quotation</h1>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">Choose a customer, then use the existing bag configurator. BOM and Book4 are unchanged.</p>
      <select
        className="mt-6 w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm"
        value={customerId}
        onChange={(event) => setCustomerId(event.target.value)}
      >
        <option value="">Select customer</option>
        {customers.map((item) => (
          <option key={item.id} value={item.id}>{item.company || item.email}</option>
        ))}
      </select>
      <Button
        className="mt-4 bg-[var(--navy)] text-white hover:bg-[var(--navy-hover)]"
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
