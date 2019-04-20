# wordlist-generator

Generate a word list by processing other word list files. Apply filters to exclude which words are included.

```
node lib/index --words data/words --exclude data/exclude --out words.json
```

```
generating word list to temp/words.json
word lengths:
 { '1': 26,
  '2': 567,
  '3': 2018,
  '4': 9095,
  '5': 21627,
  '6': 38272,
  '7': 50609,
  '8': 58246,
  '9': 57299,
  '10': 48540,
  '11': 39260,
  '12': 30152,
  '13': 21533,
  '14': 14495,
  '15': 8998,
  '16': 5267,
  '17': 3002,
  '18': 1487,
  '19': 758,
  '20': 357,
  '21': 166,
  '22': 69,
  '23': 29,
  '24': 11,
  '25': 7,
  '27': 4,
  '28': 2,
  '29': 2,
  '31': 1,
  '45': 1 }
wrote 411900 words to temp/words.json
```
