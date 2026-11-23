# Real-data fixtures

These public FASTA snapshots substitute for the instructor's missing test-data bundle. They exercise the required organisms and record counts. Their identity with the instructor's files has not been established. Both files are stored locally for offline, repeatable tests.

| File | Source | Size | SHA-256 (stored bytes) |
| --- | --- | --- | --- |
| `lambda.fasta` | NCBI RefSeq NC_001416.1 | 1 record, 48,502 bases | `78a78913d3585570fa28b7cec05e4fcf067c1aaa3740d37a377f2babda70618c` |
| `ecoli-k12.fasta` | UniProtKB/Swiss-Prot, proteome UP000000625 | 126 distinct accessions, 36,833 residues | `843caae10dad8d74a71ed7300ebd9c8ea622d665100d8a519f6b4dad5089124f` |

The lambda fixture is the FASTA response for the versioned RefSeq record. NCBI places no restrictions of its own on use and distribution of molecular data and describes possible third-party rights in its usage policy. [Record](https://www.ncbi.nlm.nih.gov/nuccore/NC_001416.1) · [FASTA retrieval](https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=NC_001416.1&rettype=fasta&retmode=text) · [NCBI molecular data policy](https://www.ncbi.nlm.nih.gov/home/about/policies/#molecular-data-usage)

The protein sample consists of the first 126 reviewed entries in ascending accession order for E. coli K-12, taxon 83333, in UniProt release 2026_04. The first accession is A0A385XJ53 and the last is P03061. Each original header supplies its accession. UniProt's API may return different records after a release, so use the packaged snapshot for replication. Credit The UniProt Consortium. The copyrightable portions are licensed under CC BY 4.0. The extraction selected complete records and normalized line endings. [Query](https://rest.uniprot.org/uniprotkb/search?query=%28proteome%3AUP000000625%29%20AND%20%28reviewed%3Atrue%29&format=fasta&size=126&sort=accession%20asc) · [UniProt license](https://www.uniprot.org/help/license) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
