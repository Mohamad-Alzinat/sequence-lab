# Held-out validation

Run `validation-2026-11-22T14-12-04-517Z` · 100 cases · 13th Gen Intel(R) Core(TM) i7-13620H · Node v24.22.3.

| Policy | Fastest | Within 10% | Geometric slowdown | Worst slowdown | Total time / fastest total | Worst case |
|---|---:|---:|---:|---:|---:|---|
| auto | 92.0% | 93.0% | 1.024× | 1.843× | 1.047× | V092 |
| bm4DNADS | 1.0% | 1.0% | 4.983× | 15.045× | 5.562× | V061 |
| bm4DNAHMbs | 82.0% | 83.0% | 1.124× | 4.684× | 1.586× | V060 |
| KMPSearch | 0.0% | 0.0% | 11.816× | 67.895× | 9.097× | V022 |
| AhoCorasickSearch | 17.0% | 17.0% | 5.831× | 73.030× | 2.921× | V022 |
| Allmer 2016 | 22.0% | 23.0% | 3.249× | 12.670× | 4.474× | V049 |

Values use per-case median milliseconds for constructing the atom and consuming all ordered hits. The denominators are the fastest observed medians for the same cases. Full-precision values and raw repetitions are in validation.json.
