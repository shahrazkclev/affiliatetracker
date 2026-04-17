import sys

with open("src/app/(admin)/admin/referrals/CustomersView.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'import { CopyButton } from "@/components/CopyButton";',
    'import { Pagination } from "@/components/Pagination";'
)

content = content.replace(
    'export async function CustomersView({ orgId, searchQuery }: { orgId: string, searchQuery: string }) {',
    'export async function CustomersView({ orgId, searchQuery, currentPage, PAGE_SIZE }: { orgId: string, searchQuery: string, currentPage: number, PAGE_SIZE: number }) {'
)

content = content.replace(
    '    const payingCustomers = customers.filter(c => c.status === \'paying\' || c.status === \'active\' || (c.commissions && c.commissions.length > 0)).length;\n',
    '    const payingCustomers = customers.filter(c => c.status === \'paying\' || c.status === \'active\' || (c.commissions && c.commissions.length > 0)).length;\n\n    const start = (currentPage - 1) * PAGE_SIZE;\n    const customersSegment = customers.slice(start, start + PAGE_SIZE);\n'
)

content = content.replace(
    'customers.length === 0 ?',
    'customersSegment.length === 0 ?'
)

content = content.replace(
    'customers.map((customer: any) => {',
    'customersSegment.map((customer: any) => {'
)

content = content.replace(
    '                                                <span className="font-medium text-zinc-200">{customer.customer_email}</span>\n                                                <CopyButton text={customer.customer_email} />',
    '                                                <span className="font-medium text-zinc-200">{customer.customer_email}</span>'
)

content = content.replace(
    '                    </table>\n                </div>\n            </div>',
    '                    </table>\n                </div>\n\n                {/* Pagination */}\n                {customers.length > PAGE_SIZE && (\n                    <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">\n                        <Pagination\n                            totalCount={customers.length}\n                            pageSize={PAGE_SIZE}\n                            currentPage={currentPage}\n                        />\n                    </div>\n                )}\n            </div>'
)

with open("src/app/(admin)/admin/referrals/CustomersView.tsx", "w") as f:
    f.write(content)
