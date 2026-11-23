# Sequence Lab

Sequence Lab finds every exact, overlapping occurrence of one or more patterns in FASTA records. Its web workspace and command-line interface share four search algorithms. You can choose a method yourself or let a calibrated model estimate which will run fastest on your input.

[Project report (PDF)](docs/report.pdf) · [UML class diagram (PDF)](docs/class-diagram.pdf) · [Benchmark results](bench/results/validation-table.md)

## Run locally

Use **Node.js 22 or later**. The project runs with Node’s built-in modules and has no package dependencies.

```sh
node server.js
```

Open [the local workspace](http://127.0.0.1:4173), select **Sequence search**, and load **DNA motifs** for a first run. **Match results** shows every occurrence and the selected method’s calculation time. **Selection inspector** explains the model’s choice. **Compare algorithms** runs each eligible method on the same input, checks that their ordered results agree, and reports the median of three timing samples.

## Try the CLI

Search for `AA` in `AAAAA`. The four overlapping hits start at positions `0`, `1`, `2` and `3`. Each output line is a JSON object with the record header, original pattern, position and length.

**Bash or Zsh**

```sh
printf '>demo\nAAAAA\n' | node bin/ios.js run ExactMatch --patterns AA
```

**PowerShell**

```powershell
@('>demo', 'AAAAA') | node bin/ios.js run ExactMatch --patterns AA
```

Use `explain` in place of `run ExactMatch` to inspect the decision. Supply comma-separated patterns with `--patterns`, add `--ignoreCase` to fold ASCII letters, or pass an algorithm identifier with `--strategy`.

| Algorithm identifier | Search method |
| --- | --- |
| `bm4DNADS` | Skips alignments using the trailing character. |
| `bm4DNAHMbs` | Uses hashed suffix blocks to skip alignments and verifies candidate matches. |
| `KMPSearch` | Reuses a pattern’s longest matching prefix after a mismatch. |
| `AhoCorasickSearch` | Searches all patterns in one pass through a shared automaton. |

Positions are zero-based UTF-16 offsets within each record. Duplicate patterns produce separate hits. The web form defaults to DNA and reports invalid characters by line and column. It also supports DNA ambiguity codes, standard protein and plain text. Matching is literal in every mode.

## Verify and reproduce

```sh
node --test
node bench/audit.js
```

The tests compare each algorithm with an independent matcher on seeded inputs, boundary cases and public FASTA fixtures. The audit checks the saved timings, fitted coefficients, algorithm decisions and policy metrics.

The saved experiment used **180 calibration cases** and **100 held-out cases**. On the recorded machine, automatic selection chose the fastest measured method in **92 of 100** held-out cases. The sum of its selected times was **4.7% above** the sum of the fastest observed times. Selection uses the first record, so later records with different characteristics can favor another algorithm.

To repeat the experiment on your machine, run the following commands in order. They replace the saved calibration and validation results with your measurements.

```sh
npm run calibrate
npm run bench
node bench/audit.js
```

## Project layout

| Location | Purpose |
| --- | --- |
| [src/](src/) | Pure matchers, algorithm classes, registry, selector and search services |
| [web/](web/) | Search workspace, results viewer, algorithm comparison and benchmark views |
| [bin/ios.js](bin/ios.js) | FASTA-to-JSONL command-line interface |
| [bench/](bench/) | Reproducible experiment scripts, raw measurements and validation table |
| [tests/](tests/) | Contract tests, integration tests and attributed fixtures |
| [docs/](docs/) | Six-page project report and class diagram |

## Academic context

**Student** Mohamad Alzinat · **Instructor** Savaş Takan

The project brief and review feedback defined the interface, timing display and sequence validation. OpenAI Codex generated the implementation, tests, benchmark tooling and report. The repository includes the sources for the algorithms and the provenance of the public datasets. [Implementation references](references/notes.md) · [Fixture sources and checksums](tests/data/README.md)
