import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import HomePage from "./components/home/HomePage";
import ContractsPage from "./components/contracts/ContractsPage";
import CarrierDetailPage from "./components/contracts/CarrierDetailPage";
import ContractJobDetailPage from "./components/contracts/ContractJobDetailPage";
import InvoiceListPage from "./components/invoices/InvoiceListPage";
import InvoiceDetailPage from "./components/invoices/InvoiceDetailPage";
import InvoiceAuditPage from "./components/invoices/InvoiceAuditPage";
import ExceptionsPage from "./components/exceptions/ExceptionsPage";
import ExceptionsAgentPage from "./components/exceptions/ExceptionsAgentPage";
import DisputesPage from "./components/disputes/DisputesPage";
import SpendPage from "./components/spend/SpendPage";
import SpendDashboardPage from "./components/spend/SpendDashboardPage";
import AgentsPage from "./components/agents/AgentsPage";
import AuditAgentPage from "./components/agents/AuditAgentPage";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="min-h-full flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-xs text-gray-300 mt-1">Coming soon</p>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },

      // Contracts
      { path: "contracts",                         Component: ContractsPage },
      { path: "contracts/jobs/:jobId",              Component: ContractJobDetailPage },
      { path: "contracts/:carrierId",              Component: CarrierDetailPage },

      // Invoice Audit
      { path: "invoices",                          Component: InvoiceListPage },
      { path: "invoices/:invoiceId",               Component: InvoiceDetailPage },
      { path: "invoices/:invoiceId/audit",         Component: InvoiceAuditPage },

      // Exceptions
      { path: "exceptions",                        Component: ExceptionsPage },
      { path: "exceptions-agent",                  Component: ExceptionsAgentPage },

      // Disputes
      { path: "disputes",                          Component: DisputesPage },

      // Spend Analysis
      { path: "spend",                             Component: SpendPage },
      { path: "spend/:slug",                       Component: SpendDashboardPage },

      // Agents
      { path: "agents",                            Component: AgentsPage },
      { path: "agents/:slug",                      Component: AuditAgentPage },

      // Stubs
      { path: "reports",  element: <Placeholder title="Reports" /> },
      { path: "graph",    element: <Placeholder title="Context Graph" /> },
      { path: "config",   element: <Placeholder title="Configuration" /> },
    ],
  },
]);