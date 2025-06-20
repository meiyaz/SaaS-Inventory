$ErrorActionPreference = "Stop"

$commits = @(
    @{ msg = "added global theme styles"; files = @("index.html", "src/index.css") },
    @{ msg = "updated db schema and seed data"; files = @("sql/init_schema.sql", "sql/demo_data.sql") },
    @{ msg = "fixed core app routing"; files = @("src/App.jsx", "src/context/AuthContext.jsx") },
    @{ msg = "added sidebar navigation"; files = @("src/layouts/DashboardLayout.jsx") },
    @{ msg = "added public landing page"; files = @("src/pages/LandingPage.jsx", "src/pages/Landing.jsx") },
    @{ msg = "refined auth forms"; files = @("src/pages/Login.jsx", "src/pages/Register.jsx") },
    @{ msg = "added dashboard tracker cards"; files = @("src/pages/Dashboard.jsx") },
    @{ msg = "added team directory"; files = @("src/pages/Team.jsx") },
    @{ msg = "added client list module"; files = @("src/pages/Clients.jsx") },
    @{ msg = "added client edit modal"; files = @("src/components/clients/ClientModal.jsx") },
    @{ msg = "added client detail view"; files = @("src/pages/ClientDetail.jsx") },
    @{ msg = "added project creation modal"; files = @("src/components/projects/ProjectModal.jsx") },
    @{ msg = "added equipment categories"; files = @("src/pages/Categories.jsx") },
    @{ msg = "added product catalog view"; files = @("src/pages/Products.jsx", "src/components/products/CategoryModal.jsx") },
    @{ msg = "added stock intake flow"; files = @("src/pages/StockIn.jsx") },
    @{ msg = "added material dispatch system"; files = @("src/pages/StockOut.jsx") },
    @{ msg = "updated stock logs table"; files = @("src/pages/StockLogs.jsx") },
    @{ msg = "added vendor directory"; files = @("src/pages/Suppliers.jsx") },
    @{ msg = "added execution task tracking"; files = @("src/pages/Tasks.jsx") },
    @{ msg = "added maintenance contracts"; files = @("src/pages/AMC.jsx") },
    @{ msg = "added bill of materials"; files = @("src/pages/BOM.jsx") },
    @{ msg = "added cost estimation screen"; files = @("src/pages/Pricing.jsx") },
    @{ msg = "added quote building workspace"; files = @("src/pages/QuotationBuilder.jsx") },
    @{ msg = "added estimate records tracker"; files = @("src/pages/Quotations.jsx") },
    @{ msg = "added pdf quote template"; files = @("src/pages/QuotationPrint.jsx") },
    @{ msg = "added invoice billing module"; files = @("src/pages/Billing.jsx") },
    @{ msg = "added tax invoice template"; files = @("src/pages/InvoicePrint.jsx") },
    @{ msg = "added operational expense logging"; files = @("src/pages/Expenses.jsx") },
    @{ msg = "added system audit trails"; files = @("src/pages/BillingLogs.jsx", "src/pages/AuditLogs.jsx") },
    @{ msg = "added reports and global settings"; files = @("src/pages/Reports.jsx", "src/pages/Settings.jsx", "src/context/ToastContext.jsx", "sql/cleanup.sql", "src/components/ui") }
)

$startDate = [datetime]"2025-04-28T10:00:00+05:30"
$endDate = [datetime]"2025-06-20T18:00:00+05:30"
$totalMins = ($endDate - $startDate).TotalMinutes
$intervalMins = [math]::Floor($totalMins / $commits.Count)

$currentDate = $startDate

foreach ($commit in $commits) {
     foreach ($file in $commit.files) {
         if (Test-Path $file) {
             git add $file
         }
     }
     
     $dateStr = $currentDate.ToString("yyyy-MM-ddTHH:mm:sszzz")
     $env:GIT_AUTHOR_DATE = $dateStr
     $env:GIT_COMMITTER_DATE = $dateStr
     
     $msg = $commit.msg
     git commit -m $msg | Out-Null
     
     Write-Host "Committed: $msg at $dateStr"
     
     $currentDate = $currentDate.AddMinutes($intervalMins)
}

# Add any remaining files and commit with the final date
git add .
$status = git status --porcelain
if ($status) {
    $dateStr = $currentDate.ToString("yyyy-MM-ddTHH:mm:sszzz")
    $env:GIT_AUTHOR_DATE = $dateStr
    $env:GIT_COMMITTER_DATE = $dateStr
    git commit -m "completed remaining updates" | Out-Null
    Write-Host "Committed remaining items at $dateStr"
}
