# Source notes

## Related projects reviewed

Savaş Takan and Jens Allmer's DNMSO describes a layered Java API for de novo mass-spectrometry result formats. Its component boundaries are a reference for comparing architectures. Sequence Lab uses its own JavaScript registry and exact-matching contract. [DNMSO repository](https://github.com/savastakan/dnmso)

Baki-B's YZM327 workshop demonstrates same-input algorithm comparisons and a technical-debt preset for the exact-matching assignment. These interactions informed the Compare algorithms tab and an independently written FASTA example. All displayed results come from the Sequence Lab algorithms and input. [Workshop](https://baki-b.github.io/YZM327-Odev-3/web/index.html#paket=teknik-borc) · [Project README](https://github.com/baki-b/YZM327-Odev-3)

## Assignment and starter

The supplied Turkish Word assignment, sections 4–7, defines the interface, minimum algorithm coverage, experiment design and report. The accompanying English specification explains possible implementations and adds interface design targets. The image supplies the IoS workspace layout. The submission materials supplied for this implementation did not include starter JavaScript or the original test fixtures. Independently sourced reference data is documented in [the fixture provenance](../tests/data/README.md).

## Algorithms

Allmer, J. (2016). *Exact pattern matching: Adapting the Boyer-Moore algorithm for DNA searches*. PeerJ Preprints 4:e1758v1. The DS section describes zeroing the terminal character's skip distance, retaining its positive displacement, checking prefix sentinels and unrolling skip checks threefold. HMbs applies a zero shift to the terminal block, saves its positive displacement, and filters candidates using the first character. The full matching contract also calls for UTF-16 indexing, exact verification and overlap preservation. [Paper](https://peerj.com/preprints/1758.pdf)

For an absent terminal block of length `q`, the maximal universally safe shift is `m − q + 1`. After any smaller positive shift through `m − q`, the complete block would still be inside the new alignment and would have to occur in the pattern. At the next shift, it can overlap the start only partially. For example, `ABCD` occurs at offset 3 in `XYZABCD` despite the absent block `ZA` at the first alignment. The paper's `m − q` is conservative for `m > q` and can stall when `m = q`. A suffix that repeats internally requires its nearest earlier block's displacement. Hash collisions require conservative shifts and exact verification. These justifications apply when choosing the corresponding adaptations.

Knuth, D., Morris, J. and Pratt, V. (1977). *Fast Pattern Matching in Strings*. SIAM Journal on Computing 6(2), 323–350. A failure table reuses the longest viable prefix after a mismatch or completed hit. [Paper](https://doi.org/10.1137/0206024)

Aho, A. and Corasick, M. (1975). *Efficient String Matching: An Aid to Bibliographic Search*. Communications of the ACM 18(6), 333–340. The trie and failure transitions share a scan across patterns. A terminal must retain the identities of duplicate patterns, and a suffix can emit a match at the same ending index. [Paper](https://doi.org/10.1145/360825.360855)

## Architecture

Alexander Shvets, *Dive Into Design Patterns*, supplied edition, pp. 37–70, 150–161, 211–219, 369–380. The substitutability discussion motivates one behavioral contract and oracle suite. Strategy describes interchangeable search implementations. Facade applies to the molecule's public entry point. An Adapter translates CLI or web inputs to that entry point. A registry of constructors is sufficient for selecting and instantiating strategies.

Harry Percival and Bob Gregory, *Architecture Patterns with Python* (O'Reilly, 2020), chapters 3–5 and 13. A service translates a use case into calls against a pure domain model. Separating I/O allows fast algorithm and selection tests. Supplying the registry at construction time lets a test insert a deterministic strategy and verify selection without modifying the molecule. The patterns apply to JavaScript without requiring the book's Python libraries.
