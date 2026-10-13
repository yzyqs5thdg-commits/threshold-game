# Design Memo: Signet Baseline VB-ERM Model (Assignment 3a)

Prepared for Meher Jain, Case Team #2, October 13, 2026. These are the recommended options. Because no reply was received before the build, the model was built on the recommendations below and each one is flagged in the "Questions for the lecturer / TAs" section of the Assumptions & Sources tab.

## 1. Segment structure: three identical tabs, NA / INTL / OTHER

Recommended and built: `Model - NA` (North America reportable segment), `Model - INTL` (International reportable segment), `Model - OTHER` (the "Other" diamond-sourcing segment plus corporate and unallocated costs). The Total Company tab is a pure sum, so FY2026A sales ($6,813.6M), operating income ($393.1M) and net income ($294.4M) reproduce the consolidated statements exactly.

Trade-off: allocating OTHER into NA and INTL would make every segment value positive and the chart tidier, but it would bury $56M of corporate cost inside the operating segments and break the tie to Signet's own segment disclosure. Keeping OTHER separate shows the corporate cost center as a negative value (about -$0.26B), which is informative for risk scenarios (e.g., a cyber incident or litigation reserve hits corporate). This is flagged as question 1 for the lecturer, because the Session 5 guidelines ask for approval of any non-standard structure.

## 2. Revenue drivers (never a hard-coded revenue line)

Total sales in each tab = (a) store merchandise sales + (b) e-commerce merchandise sales + (c) services revenue + (d) other non-retail revenue, where:

- (a) = average store count x sales per average store; store count rolls forward from beginning stores + gross openings - closures; sales per store grows at the same-store-sales assumption (price/mix plus traffic).
- (b) = prior-year e-commerce sales x (1 + e-commerce growth). For NA this includes the digital-native brands (James Allen, Blue Nile, $481.5M) and the store brands' online sales; for INTL it is H.Samuel / Ernest Jones online; OTHER is zero.
- (c) = services attach rate x merchandise sales (extended service plans, repairs, custom design; $803.5M in FY2026).
- (d) = prior year x growth; non-zero only in OTHER (diamond sourcing sales to third parties, $39.6M).

Segment-specific values: NA has openings and closures (net closures continue as mall stores are repositioned off-mall), INTL has a small net closure programme, OTHER has zero stores, zero e-commerce and zero services, with those rows kept in the layout at zero.

## 3. Expense drivers

- Cost of sales = % of total sales (gross-margin assumption; Signet books store occupancy in cost of sales).
- SG&A split into variable (% of sales: store payroll, advertising, credit costs) and fixed (grown at inflation, less a cost-savings line that is zero because no quantified programme is disclosed).
- Other operating income/(expense): one-time items. Baseline carries +$30M in FY2027 for the tariff refunds management expects, zero afterwards.
- Interest income = net yield x prior-year invested assets (cash); interest expense = rate x prior-year debt (debt is zero; the row exists for shocks).
- Income tax = effective rate x pre-tax income (24% NA/OTHER per FY2027 guidance of 23-25%; 25% INTL, the UK statutory rate).

## 4. Line-item granularity (cash basis)

Kept: cash (invested assets), inventory (non-depreciating operating asset), debt, and a single "other liabilities, net" line that calibrates the simplified balance sheet to reported shareholders' equity ($1,966.2M). Excluded: depreciation and amortization, capital expenditures, receivables, payables, leases, goodwill and intangibles, deferred revenue, per the Session 5 guideline that accounting should be as close to cash as possible. The income statement has enough lines for the likely 3(d) shocks: competition/lab-grown pricing (sales per store, gross margin), tariffs/supplier disruption (gross margin, one-time costs), cyber/IT outage (e-commerce growth, one-time costs), store traffic (same-store sales), reputational events (sales per store, advertising in variable SG&A), UK/Ireland recession and FX (INTL drivers), interest rates (yield on cash, rate on debt, discount rate).

## 5. Horizon and valuation approach: profits released, 10 years + terminal equity

Last Yr = FY2026A, model years FY2027-FY2036. Approach: **profits released** (the Pear approach). Net income is distributed each year, the balance sheet is static, and segment value = NPV(discount rate, distributable cash flows FY2027-FY2036) + ending equity / (1 + discount rate)^10. Justification: common dividends plus buybacks were $257M against $294M of net income in FY2026 (87%), $197M against about $84M in the first half of FY2027, and the board added a $125M accelerated repurchase in September 2026, so distributing all earnings is the closer approximation of Signet's actual behaviour. Equity(t) = Equity(t-1) + Net income(t) - Distributions(t) holds in every tab and is tested on the Checks tab.

## 6. Discount rate

CAPM: risk-free 5.24% (10-year Treasury, October 9, 2026), beta 1.25 (midpoint of 1.10-1.44 published betas), implied equity risk premium 4.20% (Damodaran, October 1, 2026) gives 10.5% for NA and OTHER. INTL carries a 1.5-point premium (12.0%) for scale, UK demand weakness and GBP exposure. No sell-side WACC was retrievable; 10.5% is inside the 9-12% band typical for specialty retail.

## 7. Significant digits

$ millions to one decimal; rates to 0.1%; store counts as integers; sales per store in $M to three decimals.

## Calibration targets

FY2027 model: sales about $6.83B (guidance $6.7-6.9B, consensus $6.84B); operating income about $565M (adjusted guidance $535-605M); EPS about $11.2 on 38.8M shares (adjusted guidance $10.45-12.15). Company value within +/-30% of the $3.95B market capitalization.
