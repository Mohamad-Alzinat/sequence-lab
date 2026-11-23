export const sequenceAlphabets = {
  DNA: {label: 'DNA', letters: 'ACGT'},
  AmbiguousDNA: {label: 'DNA with ambiguity codes', letters: 'ACGTRYSWKMBDHVN'},
  Protein: {label: 'Protein (20 standard amino acids)', letters: 'ACDEFGHIKLMNPQRSTVWY'},
  Text: {label: 'Plain text', letters: ''}
};

export function parseFasta(text, alphabet = 'Text') {
  if (typeof text !== 'string') throw new TypeError('FASTA input must be text.');
  if (!Object.hasOwn(sequenceAlphabets, alphabet)) throw new Error('Choose a supported sequence alphabet.');
  const {label, letters} = sequenceAlphabets[alphabet];
  const invalid = letters ? new RegExp('[^' + letters + letters.toLowerCase() + '\\s]', 'u') : null;
  const records = [];
  let header = null, lines = [];
  for (const [index, line] of text.replace(/^\uFEFF/,'').split(/\r\n?|\n/).entries()) {
    if (!line.trim()) continue;
    if (line[0] === '>') {
      if (header !== null) records.push({header,seq:lines.join('')});
      header = line; lines = [];
    } else {
      if (header === null) throw new Error('Start the first FASTA record with a >header line.');
      const match = invalid?.exec(line);
      if (match) {
        throw new Error('Invalid ' + label + ' character “' + match[0] + '” on line ' +
          (index + 1) + ', column ' + (match.index + 1) + '. Allowed letters: ' + letters + '.');
      }
      lines.push(line.replace(/\s/g,''));
    }
  }
  if (header === null) throw new Error('Enter at least one FASTA record.');
  records.push({header,seq:lines.join('')});
  return records;
}
