"""
Sutra Business & Finance MCP Server
Unified Stdio MCP Server for Legal Accounting, Statutory Penalty Calculations, and Entity Tax Planning
"""

import os
import sys
from mcp.server.mcpserver import MCPServer

app = MCPServer(name="Sutra-Finance-Hub")

@app.tool()
def calculate_lien_penalties_and_interest(
    principal_amount: float,
    days_delinquent: int = 365,
    statutory_penalty_rate: float = 0.10,
    annual_interest_rate: float = 0.07,
    attorney_or_sanctions_hours: float = 0.0,
    hourly_sanctions_rate: float = 350.0
) -> str:
    """Calculate statutory interest, penalties, and Labor Code § 5813 sanctions for California WCAB Petitions."""
    penalty = principal_amount * statutory_penalty_rate
    interest = principal_amount * (annual_interest_rate * (days_delinquent / 365.25))
    sanctions = attorney_or_sanctions_hours * hourly_sanctions_rate
    grand_total = principal_amount + penalty + interest + sanctions
    return f"""### 💰 Itemized Accounting & Sanctions Schedule:
- **Principal Debt:** ${principal_amount:,.2f}
- **Mandatory Statutory Penalty ({statutory_penalty_rate*100:.0f}%):** ${penalty:,.2f}
- **Statutory Interest ({annual_interest_rate*100:.0f}% over {days_delinquent} days):** ${interest:,.2f}
- **Labor Code § 5813 Bad-Faith Sanctions ({attorney_or_sanctions_hours} hrs @ ${hourly_sanctions_rate:.2f}/hr):** ${sanctions:,.2f}
- **────────────────────────────────────────────**
- **TOTAL DEMANDED FOR RECOVERY:** **${grand_total:,.2f}**
"""

@app.tool()
def calculate_entity_tax_optimization(
    annual_net_profit: float,
    owner_w2_salary_ratio: float = 0.40
) -> str:
    """Calculate tax savings comparing Sole Proprietorship / LLC vs S-Corporation."""
    sole_prop_se_tax = annual_net_profit * 0.9235 * 0.153
    scorp_salary = annual_net_profit * owner_w2_salary_ratio
    scorp_distribution = annual_net_profit * (1 - owner_w2_salary_ratio)
    scorp_payroll_tax = scorp_salary * 0.153
    estimated_tax_savings = sole_prop_se_tax - scorp_payroll_tax
    return f"""### 📊 Entity Tax Planning & Optimization Summary:
- **Annual Net Profit:** ${annual_net_profit:,.2f}
- **Sole Proprietorship / LLC Self-Employment Tax (15.3%):** ${sole_prop_se_tax:,.2f}
- **S-Corporation Optimization Strategy:**
  * Owner W-2 Salary (Subject to FICA @ {owner_w2_salary_ratio*100:.0f}%): ${scorp_salary:,.2f}
  * Owner Profit Distributions (EXEMPT from FICA/SE tax): ${scorp_distribution:,.2f}
  * S-Corp Total Payroll Tax: ${scorp_payroll_tax:,.2f}
- **────────────────────────────────────────────**
- **ESTIMATED ANNUAL SE TAX SAVINGS:** **${estimated_tax_savings:,.2f}**
"""

if __name__ == "__main__":
    app.run()
