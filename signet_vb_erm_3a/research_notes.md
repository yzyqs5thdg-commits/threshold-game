# Research Notes: Signet Jewelers Limited (NYSE: SIG) Baseline Inputs for the Value-Based ERM Model

Case Team #2 (Meher Jain, Zainab Razzaque, Stanley Weng, Jana Chamsi Bacha, Anderson Chan), Columbia University ERMC PS5900 Capstone, Fall 2026. Case Assignment #3(a). Notes compiled October 13, 2026.

## 0. How these numbers were obtained, and what still needs a second look

The primary source for all historical figures is Signet's Form 10-K for the fiscal year ended January 31, 2026 ("Fiscal 2026"; Signet Jewelers Limited, 2026a) and the fourth-quarter earnings release filed as Exhibit 99.1 to Form 8-K on March 19, 2026 (Signet Jewelers Limited, 2026b). The build environment could not open sec.gov, signetjewelers.com or the q4cdn investor-relations host directly (the network policy returned a 403 for every attempt), so every figure below was taken from web-search excerpts of those documents and of their verbatim re-publications (Business Wire, Nasdaq, Morningstar, StreetInsider). The `data/` folder tags each figure with a confidence code: **A** quoted verbatim from the primary document excerpt, **B** quoted from a verbatim re-publication or a secondary summary of the primary document, **C** derived by arithmetic from A/B figures, **D** team allocation or estimate.

Three items could not be retrieved and are therefore team allocations that should be replaced from the 10-K once a teammate opens it: (1) the Fiscal 2026 segment-level cost of sales and SG&A table in the segment note (ASU 2023-07 "significant segment expenses"); (2) the Fiscal 2026 International adjusted operating income; and (3) the goodwill, intangibles and deferred-revenue balances (not needed for the cash-basis projection but useful for the balance-sheet reconciliation). The allocation actually used is in `data/model_calibration_fy2026.csv` and in the "Reclassifications and calibration" section of the workbook's Assumptions & Sources tab.

## 1. Segment data (Fiscal 2026, Fiscal 2025, Fiscal 2024)

Signet manages the business as three reportable segments: North America, International and Other, with corporate and unallocated costs shown separately in the segment note (Signet Jewelers Limited, 2026a). The North America segment operates Kay, Zales, Jared, Diamonds Direct, Banter by Piercing Pagoda, Rocksbox, the digital brands James Allen and Blue Nile, and Peoples Jewellers in Canada; the International segment operates H.Samuel and Ernest Jones in the UK and the Republic of Ireland; the Other segment consists of the subsidiaries that purchase and convert rough diamonds to polished stones (Signet Jewelers Limited, 2026a).

| $ millions | FY2024 | FY2025 | FY2026 | Source |
|---|---|---|---|---|
| Sales, North America | 6,703.8 | 6,299.1 | 6,363.6 | Signet Jewelers Limited (2025a, 2026a) |
| Sales, International | 430.7 | 373.2 | 410.4 | Signet Jewelers Limited (2025a, 2026a) |
| Sales, Other | n/r | 31.5 | 39.6 | Signet Jewelers Limited (2025a, 2026a) |
| Sales, consolidated | 7,171.1 | 6,703.8 | 6,813.6 | Signet Jewelers Limited (2024, 2026b) |
| Operating income (GAAP), North America | 677.0 | 173.7 | 452.6 | Signet Jewelers Limited (2025a, 2026b) |
| Operating income (GAAP), International | 13.1 | 1.0 | 16.3 | Signet Jewelers Limited (2025a, 2026b) |
| Operating income (GAAP), Other + corporate | n/r | (64.0) | (75.8) | derived |
| Operating income (GAAP), consolidated | n/r | 110.7 | 393.1 | Signet Jewelers Limited (2026b) |
| Adjusted operating income, North America | 709.4 | 551.2 | 560.3 | Signet Jewelers Limited (2025b, 2026b) |
| Adjusted operating income, International | 2.0 | 9.5 | n/r | Signet Jewelers Limited (2025b) |
| Adjusted operating income, consolidated | n/r | n/r | 515.0 | Signet Jewelers Limited (2026b) |

n/r = not retrieved in this session. Fiscal 2024 was a 53-week year; the extra week added $103.2 million of sales (Signet Jewelers Limited, 2024). Fiscal 2025 North America operating income includes $371.7 million of goodwill and indefinite-lived intangible impairments, and Fiscal 2026 includes further digital-brand impairments and restructuring charges that explain the gap between GAAP ($393.1 million) and adjusted ($515.0 million) operating income (Signet Jewelers Limited, 2025a, 2026a, 2026b). The FY2025 10-K segment table shows SG&A of $1,964.7 million for North America, $103.1 million for International and $51.3 million for corporate and unallocated (Signet Jewelers Limited, 2025a); these ratios were used to allocate Fiscal 2026 SG&A because the Fiscal 2026 table was not retrievable.

**Store counts.** North America began Fiscal 2026 with 2,379 stores, opened 14, closed 64 and ended with 2,329; International began with 263, opened none, closed 10 and ended with 253; the company total fell from 2,642 to 2,582 (Signet Jewelers Limited, 2026a). By August 1, 2026 the fleet was 2,534 stores (North America 2,282 after 3 openings and 50 closures; International 252 after 2 openings and 3 closures) with 4.0 million square feet of selling space (Signet Jewelers Limited, 2026d).

**Sales by banner, Fiscal 2026.** Kay $2,572.6 million; Zales $1,235.5 million; Jared $1,143.0 million; Diamonds Direct $374.1 million; Blue Nile $339.0 million; Banter by Piercing Pagoda $330.1 million; Peoples $213.2 million; James Allen $142.5 million; International $410.4 million (Signet Jewelers Limited, 2026a). The two digital-native brands therefore generated $481.5 million, or 7.6% of North America sales.

## 2. Consolidated income statement

| $ millions | FY2025 | FY2026 | Source |
|---|---|---|---|
| Sales | 6,703.8 | 6,813.6 | Signet Jewelers Limited (2026b) |
| Cost of sales | (4,078.2) | (4,119.0) | Signet Jewelers Limited (2026a, 2026b) |
| Gross margin | 2,625.6 (39.2%) | 2,694.6 (39.5%) | Signet Jewelers Limited (2026a) |
| SG&A | (2,122.6) (31.7%) | (2,173.2) (31.9%) | Signet Jewelers Limited (2026a, 2026b) |
| Other operating income (expense), net | n/r | (128.3) | derived |
| Operating income | 110.7 (1.7%) | 393.1 (5.8%) | Signet Jewelers Limited (2026b) |
| Interest income (expense), net | 9.8 | 4.0 | Signet Jewelers Limited (2026b) |
| Other non-operating income, net | 3.7 | 1.0 | Signet Jewelers Limited (2026b) |
| Income before income taxes | 124.2 | 398.1 | Signet Jewelers Limited (2026b) |
| Income taxes | (63.0) | (103.7) | Signet Jewelers Limited (2026b) |
| Effective tax rate | 50.7% | 26.0% | Signet Jewelers Limited (2026b) |
| Net income | 61.2 | 294.4 | Signet Jewelers Limited (2026b) |
| Diluted EPS (GAAP) | n/r | $7.08 | Signet Jewelers Limited (2026b) |
| Adjusted diluted EPS | n/r | $9.60 | Signet Jewelers Limited (2026b) |

Fiscal 2024 net income was $810.4 million and diluted EPS $15.01, inflated by a $4.94 per share deferred-tax benefit from Bermuda's Corporate Income Tax Act 2023 (Signet Jewelers Limited, 2024). The implied Fiscal 2026 diluted share count is 41.6 million ($294.4 million / $7.08); the Fiscal 2027 guidance assumes roughly 38.8 million weighted diluted shares after buybacks (Signet Jewelers Limited, 2026c). The SG&A increase in Fiscal 2026 was driven mainly by a reset of incentive compensation (Signet Jewelers Limited, 2026a). Operating cash flow was $678.8 million and capital expenditures $153.5 million (Signet Jewelers Limited, 2026b).

## 3. Balance sheet at January 31, 2026

Cash and cash equivalents were $874.8 million (up from $604.0 million), inventories $1,940.1 million (flat year on year), operating-lease right-of-use assets $1,146.6 million and total assets $5,952.1 million; accounts payable were $772.1 million, accrued expenses and other current liabilities $387.3 million, non-current operating-lease liabilities $930.4 million and total liabilities $3,985.9 million, giving shareholders' equity of about $1,966.2 million (Signet Jewelers Limited, 2026a, 2026b). Signet carried no funded debt: the senior notes were repaid in Fiscal 2025 and the asset-based revolver is undrawn (Signet Jewelers Limited, 2026a; Jain et al., 2026).

## 4. Capital return (justification for "profits released")

| $ millions | FY2024 | FY2025 | FY2026 | H1 FY2027 |
|---|---|---|---|---|
| Common share repurchases | 139.3 | 138.0 | 205.2 | 169.9 |
| Preferred share repurchase | – | 813.8 | – | – |
| Common dividends paid | 41.1 (declared) | 48.6 | 51.9 | 26.8 |
| Preferred dividends paid | n/r | 18.5 | – | – |
| Net income | 810.4 | 61.2 | 294.4 | approx. 84 |
| Common distributions / net income | 0.22 | 3.05 | 0.87 | approx. 2.3 |

Sources: Signet Jewelers Limited (2025a, 2026a, 2026b, 2026d). Dividends declared per common share rose from $0.92 (FY2024) to $1.16 (FY2025) and $1.28 (FY2026), and the Fiscal 2027 quarterly dividend is $0.35 (Signet Jewelers Limited, 2026a, 2026b). Remaining repurchase authorization was $517.9 million at January 31, 2026, and a $125 million accelerated share repurchase was announced with the second-quarter results (Signet Jewelers Limited, 2026a, 2026c). Excluding the Fiscal 2024 one-off tax benefit and the Fiscal 2025 impairments, common dividends plus buybacks have run at roughly 85% to 110% of underlying earnings, which supports the Session 5 observation that "dividends + share repurchases have approximately equaled earnings in recent years" and the choice of the profits-released valuation approach.

## 5. Operating KPIs

Same-store sales rose 1.3% in Fiscal 2026 (North America +1.2%, International +2.6%) and 2.2% in the second quarter of Fiscal 2027 (Signet Jewelers Limited, 2026b, 2026c). E-commerce was 21.8% of total sales (Signet Jewelers Limited, 2026f). Sales by category in Fiscal 2026 were bridal $2,863.6 million, fashion $2,630.5 million, watches $350.4 million, services $803.5 million (+7.8%, driven by extended service plans) and other $165.6 million (Signet Jewelers Limited, 2026a). A filing summary puts lab-grown diamond products at about 27% of merchandise sales; this should be verified against Item 1 of the 10-K. Signet's five largest suppliers accounted for about 22% of purchases, the largest about 6%, with diamond cutting and jewelry manufacturing predominantly in Asia (Columbia University Capstone, Session 5, slide 14).

**Tariffs and credit.** The IEEPA tariffs were invalidated in February 2026; Signet had received about $20 million of refunds by the end of the second quarter of Fiscal 2027 and expects about $30 million for the year, while stating that tariffs remain a net headwind and that no further refunds or new tariffs are forecast (Signet Jewelers Limited, 2026d; CNBC, 2026). A new consumer-credit agreement with Bread Financial is expected to add $30 million to $40 million of non-comp revenue and gross-margin benefit in Fiscal 2027 (Signet Jewelers Limited, 2026c; CNBC, 2026). Higher gold costs pressured unit demand at lower price points (CNBC, 2026).

## 6. Management outlook (Fiscal 2027 guidance)

| Item | Original (Mar 2026) | After Q1 (Jun 2026) | After Q2 (Sep 2026) |
|---|---|---|---|
| Total sales | $6.6–6.9 billion | $6.7–6.9 billion | $6.7–6.9 billion |
| Same-store sales | (1.25%)–2.5% | (0.75%)–2.5% | Flat–2.5% |
| Adjusted operating income | n/r | $480–560 million | $535–605 million |
| Adjusted EBITDA | n/r | $665–745 million | $730–800 million |
| Adjusted diluted EPS | $8.80–10.74 | $9.20–11.00 | $10.45–12.15 |
| Tax rate (ex discrete items) | | | 23–25% |
| Weighted diluted shares | | | approx. 38.8 million |
| Net selling square footage | | low-single-digit decline | low-single-digit decline |

Sources: Signet Jewelers Limited (2026b, 2026c, 2026e). Consensus estimates are revenue of about $6.84 billion (FY2027) and $6.95 billion (FY2028) and diluted EPS of $10.76 (FY2027), $12.27 (FY2028) and $13.14 (FY2029) (Yahoo Finance, 2026; WallStreetZen, 2026).

## 7. Market data and cost of equity

SIG closed at $105.22 on October 9, 2026 (Yahoo Finance, 2026). Share-count sources disagree (38.32 million per MarketBeat, 2026; 37.29 million per Google Finance, 2026); the model uses 37.5 million, giving a market capitalization of about $3.95 billion, consistent with the $3.75–3.92 billion range aggregators showed a week earlier (StockAnalysis, 2026; The Motley Fool, 2026). Trailing P/E was 11.8x and reported betas range from 1.10 (MarketBeat, 2026) and 1.12 (Google Finance, 2026) to 1.44 (The Motley Fool, 2026); consensus 12-month price targets are $110.64–125.56 (MarketBeat, 2026; WallStreetZen, 2026).

The 10-year Treasury constant-maturity yield was 5.24% on October 9, 2026 after touching 5.31% on October 5, the highest since 2002 (Board of Governors of the Federal Reserve System, 2026a); the federal funds target range is 3.75–4.00% (Board of Governors of the Federal Reserve System, 2026b). Damodaran's implied equity risk premium was 4.20% on October 1, 2026 (Damodaran, 2026). CAPM with a 1.25 beta (midpoint of the reported range) gives a cost of equity of 5.24% + 1.25 × 4.20% = 10.5%. No published sell-side WACC was retrievable; the 10.5% North America rate sits inside the 9–12% band typically used for specialty retailers, and International carries a 1.5-point premium (12.0%) for its smaller scale, weaker UK demand and currency exposure.

## 8. Macro

The FOMC's September 2026 median projections are real GDP growth of 2.3% (2026), 2.4% (2027) and 2.2% (2028) with PCE inflation of 3.7%, 2.3% and 2.1% (Board of Governors of the Federal Reserve System, 2026b). The Bank of Canada projects growth of 0.7% in 2026 and 1.8% in 2027 and 2028, with CPI inflation of 2.5% and 2.0% (Bank of Canada, 2026). The IMF's January 2026 update has UK growth of 1.3% and 1.5% (International Monetary Fund, 2026a); secondary coverage of the Bank of England's 2026 reports puts UK CPI near 3% in early 2027, falling toward 1.7–2% by 2028 (Vanguard, 2026). Irish modified domestic demand is projected to grow about 2.5% a year in 2026–27 (International Monetary Fund, 2026b; European Commission, 2026). These support a 2.0–2.5% nominal growth anchor for North America store productivity and a 2.0% anchor for the UK and Ireland, with fixed-cost inflation of 2.5% trending to 2.0% in North America and 3.0% trending to 2.0% in International.

## References

Bank of Canada. (2026, July 15). *Monetary policy report: July 2026*. https://www.bankofcanada.ca/publications/mpr/mpr-2026-07-15/projections/

Board of Governors of the Federal Reserve System. (2026a, October 9). *H.15 selected interest rates (daily)*. https://www.federalreserve.gov/releases/h15/

Board of Governors of the Federal Reserve System. (2026b, September 16). *Summary of economic projections*. https://www.federalreserve.gov/monetarypolicy/fomcprojtabl20260916.htm

CNBC. (2026, September 9). *Signet shares soar as jeweler lifts annual profit forecast*. https://www.cnbc.com/2026/09/09/signet-shares-soar-as-jeweler-lifts-annual-profit-forecast.html

Columbia University Capstone. (2026a). *Capstone Fall 2026, Session 5* [Lecture slides]. ERMC PS5900, Columbia University.

Columbia University Capstone. (2026b). *Capstone Fall 2026, Session 6* [Lecture slides]. ERMC PS5900, Columbia University.

Damodaran, A. (2026). *Implied equity risk premium update, October 1, 2026*. NYU Stern School of Business. https://pages.stern.nyu.edu/~adamodar/New_Home_Page/home.htm

European Commission. (2026, May). *Economic forecast for Ireland (Spring 2026)*. https://economy-finance.ec.europa.eu/economic-surveillance-eu-member-states/country-pages-including-country-reports/ireland/economic-forecast-ireland_en

Google Finance. (2026). *Signet Jewelers Ltd (SIG) stock price and news*. https://www.google.com/finance/quote/SIG:NYSE

International Monetary Fund. (2026a, January). *World economic outlook update*. https://www.imf.org/en/Publications/WEO

International Monetary Fund. (2026b, June 29). *IMF Executive Board concludes 2026 Article IV consultation with Ireland* (Press Release No. 26/225). https://www.imf.org/en/news/articles/2026/06/29/pr26225-ireland-imf-executive-board-concludes-2026-article-iv-consultation

Jain, M., Razzaque, Z., Weng, S., Chamsi Bacha, J., & Chan, A. (2026). *Signet Jewelers Limited: Enterprise risk management program review* (Case Assignment #2) [Unpublished course paper]. Columbia University.

MarketBeat. (2026). *Signet Jewelers (SIG) stock price, news and analysis*. https://www.marketbeat.com/stocks/NYSE/SIG/

Segal, S. (2011). *Corporate value of enterprise risk management: The next step in business management*. John Wiley & Sons.

Signet Jewelers Limited. (2024). *Annual report on Form 10-K for the fiscal year ended February 3, 2024*. U.S. Securities and Exchange Commission. https://www.sec.gov/Archives/edgar/data/832988/000083298824000083/sig-20240203.htm

Signet Jewelers Limited. (2025a). *Annual report on Form 10-K for the fiscal year ended February 1, 2025*. U.S. Securities and Exchange Commission. https://www.sec.gov/Archives/edgar/data/832988/000083298825000018/sig-20250201.htm

Signet Jewelers Limited. (2025b, March 19). *Signet Jewelers reports fourth quarter and Fiscal 2025 results* [Press release]. Business Wire. https://www.businesswire.com/news/home/20250319542686/en/

Signet Jewelers Limited. (2026a). *Annual report on Form 10-K for the fiscal year ended January 31, 2026*. U.S. Securities and Exchange Commission. https://www.sec.gov/Archives/edgar/data/832988/000083298826000055/sig-20260131.htm

Signet Jewelers Limited. (2026b, March 19). *Signet Jewelers reports fourth quarter and full year Fiscal 2026 results* [Press release; Form 8-K Exhibit 99.1]. U.S. Securities and Exchange Commission. https://www.sec.gov/Archives/edgar/data/832988/000083298826000054/fy27ex9913x19x26pressrelea.htm

Signet Jewelers Limited. (2026c, September 9). *Signet Jewelers reports second quarter Fiscal 2027 results* [Press release; Form 8-K Exhibit 99.1]. U.S. Securities and Exchange Commission. https://www.sec.gov/Archives/edgar/data/0000832988/000083298826000227/fy27ex99109x09x26pressrele.htm

Signet Jewelers Limited. (2026d). *Quarterly report on Form 10-Q for the quarterly period ended August 1, 2026*. U.S. Securities and Exchange Commission. https://www.sec.gov/Archives/edgar/data/0000832988/000083298826000229/sig-20260801.htm

Signet Jewelers Limited. (2026e). *Quarterly report on Form 10-Q for the quarterly period ended May 2, 2026*. U.S. Securities and Exchange Commission. https://www.sec.gov/Archives/edgar/data/0000832988/000083298826000159/sig-20260502.htm

Signet Jewelers Limited. (2026f). *Fiscal 2026 annual report*. https://s26.q4cdn.com/755441662/files/doc_financials/annual/SIG-fy26-AR.pdf

StockAnalysis. (2026). *Signet Jewelers (SIG) statistics and valuation*. https://stockanalysis.com/stocks/sig/statistics/

The Motley Fool. (2026). *Signet Jewelers (SIG) stock price and news*. https://www.fool.com/quote/nyse/sig/

Vanguard. (2026, August 11). *Vanguard economic and market outlook: United Kingdom*. https://externalcrewnet.vanguard.com/content/corporatesite/us/en/corp/vemo/vemo-united-kingdom.html

WallStreetZen. (2026). *Signet Jewelers stock forecast and predictions*. https://www.wallstreetzen.com/stocks/us/nyse/sig/stock-forecast

Yahoo Finance. (2026). *Signet Jewelers Limited (SIG) analysis and historical quotes*. https://finance.yahoo.com/quote/SIG/analysis/
