# Signet Baseline VB-ERM Model (Assignment 3a): One-Page Summary for Team #2

Workbook: `Team2_Signet_VB-ERM_Baseline_3a.xlsx` (8 tabs: Cover, Assumptions & Sources, Model - NA, Model - INTL, Model - OTHER, Total Company, Summary & Chart, Checks). Built October 13, 2026 from `build/build_model.py`; recalculated in LibreOffice; all 32 integrity checks TRUE. $ millions.

## Baseline company value by segment

| Segment | Baseline value | % of total | Discount rate | FY2026A sales | FY2027E net income |
|---|---:|---:|---:|---:|---:|
| North America | 3,452.2 | 104.7% | 10.5% | 6,363.6 | 461.0 |
| International | 107.7 | 3.3% | 12.0% | 410.4 | 13.0 |
| Other / Corporate | (263.4) | (8.0%) | 10.5% | 39.6 | (41.2) |
| **Total company** | **3,296.5** | 100% | | 6,813.6 | 432.9 |

Market capitalization on October 9, 2026 was about $3,945.8M ($105.22 x 37.5M shares), so the model sits 16.5% below the market (model value per share $87.91). That gap is inside the +/-30% band the brief treats as plausible; it mostly reflects a static balance sheet (no buyback-driven EPS growth, no value for cash above book) and a 10.5% cost of equity at a 5.24% risk-free rate.

FY2027E lands inside management's September 2026 guidance: sales $6,831.5M (guidance $6.7-6.9B; consensus $6.84B), operating income $563.7M (adjusted guidance $535-605M), diluted EPS $11.16 on 38.8M shares (adjusted guidance $10.45-12.15; consensus $10.76). FY2028 dips slightly (no repeat of the $30M tariff refund) and then grows about 2-3% a year.

## Valuation approach and why

Profits released (the Pear approach): each segment distributes 100% of net income every year, the simplified cash-basis balance sheet is static, and segment value = NPV at the segment cost of equity of FY2027-FY2036 distributable cash flows + PV of terminal equity (= FY2036 shareholders' equity, $1,966.2M in total). Company value = sum of segment values. Justification: common dividends plus buybacks were $257M against $294M of net income in FY2026 (87%), about $197M against roughly $84M in H1 FY2027, with a further $125M accelerated repurchase announced in September 2026, so distributing all earnings matches Signet's behaviour better than retaining them. Equity(t) = Equity(t-1) + NI(t) - Distributions(t) holds in every tab (Checks tab).

## The five assumptions that move the answer most (total value, re-run of the model)

| Assumption shocked (all years, all segments) | -1pp | Base | +1pp | Impact of +1pp |
|---|---:|---:|---:|---:|
| Gross margin (cost of sales % moves the other way) | 2,965.5 | 3,296.5 | 3,627.6 | +331.0 (+10.0%) |
| Variable SG&A % of sales | 3,627.6 | 3,296.5 | 2,965.5 | -331.0 (-10.0%) |
| Revenue growth (same-store, e-commerce and other revenue growth) | 2,985.6 | 3,296.5 | 3,624.6 | +328.0 (+10.0%) |
| Fixed SG&A inflation | 3,491.8 | 3,296.5 | 3,090.5 | -206.0 (-6.2%) |
| Discount rate (cost of equity) | 3,480.7 | 3,296.5 | 3,126.4 | -170.1 (-5.2%) |
| Effective tax rate | 3,330.5 | 3,296.5 | 3,262.6 | -33.9 (-1.0%) |
| NA store closures +/-10 per year | 3,387.6 | 3,296.5 | 3,205.5 | -91.0 (-2.8%) |

Reading: one point of gross margin or of variable SG&A is worth about $330M of value (10%); one point of annual revenue growth about the same; a point on the discount rate about $170-185M. These are the levers 3(d) scenarios (lab-grown pricing, tariffs/gold, traffic shocks, cyber outage, UK recession, rates) will push.

## Open questions for the lecturer / TAs

1. Three-tab structure with OTHER = diamond sourcing + corporate (negative value of -$263M). Acceptable, or allocate corporate costs into NA/INTL?
2. Profits released rather than profits retained: confirm acceptable and that the same approach must carry into 3(d).
3. Terminal value = book equity via a single "other liabilities, net" calibration plug: preferred to a tangible-equity terminal value?
4. Segment cost allocation: the FY2026 segment cost-of-sales/SG&A table (Note 5) was not retrievable in the build environment; do they want the replacement before Session 7?
5. One CAPM rate per segment (10.5% / 12.0% / 10.5%) at a 5.24% 10-year Treasury: is an International premium appropriate?

## Things a teammate should double-check (in priority order)

1. Open the 10-K (sig-20260131.htm) and replace the allocated FY2026 segment cost of sales / SG&A / other operating items (Model tabs, Last Yr column, rows 72, 75-76, 79) with the Note 5 figures; segment operating income must still tie (452.6 / 16.3 / -75.8). Then rerun `python3 build/build_model.py` so the baseline snapshot is re-pasted.
2. Confirm the e-commerce split (NA $1,423.8M / INTL $61.6M of the 21.8% total) and services split (NA $760.0M / INTL $41.0M of $803.5M) against the 10-K disaggregation note; these set sales per store.
3. Confirm shares outstanding (37.5M used; sources range 37.3-38.3M) and the October 9 close ($105.22); update the market block on the Total Company tab if the submission date moves.
4. Review the FY2027 cost-of-sales step-down to 59.3% in NA (credit-agreement benefit) and the +$30M FY2027 tariff refund in other operating income; both are management statements, not booked results.
5. Sanity-check the 0.7% net yield on cash (calibrated to reported net interest income of $4.0M) and whether the TAs prefer gross interest income at a money-market rate.
6. Open the file in desktop Excel (not Google Sheets), confirm the Cover status cell shows "ALL CHECKS PASS", the two charts render on Summary & Chart, and save once so cached values are stored.
