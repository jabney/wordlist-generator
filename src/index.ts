import fs from 'fs'
import readStreams from './read-streams'
import { allPaths } from './paths'

import { parseArgs, ISchema, IInfo, IParseArgs } from './args'
import { excludeFilter as filterExcluded } from './exclusions'

const $info: IInfo = {
  command: 'words',
  description: 'create a word list structure from files'
}

const $schema: ISchema = {
  // '$default': {
  //   type: 'string',
  // },
  'words': {
    type: 'str',
    desc: 'a list of word files to process',
  },
  'exclude': {
    type: 'str',
    desc: 'a list of exclude-word files'
  },
  'out': {
    type: 'str',
    desc: 'out file path',
    num: 1,
  },
  'w': {
    alias: 'words',
  },
  'e': {
    alias: 'exclude',
  },
  'o': {
    alias: 'out',
  },
}

interface IGenArgs extends IParseArgs {
  words: string[]
  exclude: string[]
  out: string
}

/**
 * Build a map of { WordLength => WordListLength }.
 */
function buildWordLengthStats(map: {[key: number]: string[]}) {
  // Get the map entries.
  const entries = Object.entries(map)

  // Build a stats table of word lengths and counts.
  const stats = entries.reduce((map, entry) => {
    // Get the word length and word list from the map
    const [length, list] = entry
    // Map word length to list length.
    map[+length] = list.length
    return map
  }, {} as {[key: number]: number})

  return stats
}

/**
 * Build a map of { WordLength => Word[] } to retrieve
 * words by length.
 */
function buildWordLengthMap(words: Set<string>) {
  // Convert the word set into an array.
  const list = [...words]

  // Build the map by walking the list.
  const lengthMap = list.reduce((map, word) => {
    // Get or create the list for the given length.
    const entry = map[word.length] || []
    // Add the word to the list.
    entry.push(word)
    // Assign the list to the map.
    map[word.length] = entry
    return map
  }, {} as {[key: number]: string[]})

  return lengthMap
}

/**
 * Generate a set of words and a word-length map.
 */
async function generate(args: IGenArgs) {
  const wordPaths = await allPaths(args.words)
  const excludePaths = await allPaths(args.exclude)
  const isExcluded = await filterExcluded(excludePaths)

  // Store words in a set to remove duplicates.
  const words = new Set<string>()

  await readStreams(wordPaths, async (word) => {
    // If a word is not alphabetical, do nothing.
    if (!/^[a-z]+$/i.test(word)) { return }

    // Check if the word is excluded.
    if (!isExcluded(word)) {
      // Add the lower-cased word to the set.
      words.add(word.toLowerCase())
    }
  })

  // Build the word length map.
  return [words, buildWordLengthMap(words)] as [Set<string>, {[key: number]: string[]}]
}

/**
 *
 */
async function main() {
  const args = parseArgs<IGenArgs>($info, $schema)

  if (!args) {
    return
  }

  if (args.words.length === 0) {
    return console.error('no words paths specified')
  }

  if (args.exclude.length === 0) {
    return console.error('no exclude paths specified')
  }

  if (!args.out) {
    return console.error('no outfile path specified')
  }

  console.log(`generating word list to ${args.out}`)

  // Build the word length map.
  const [words, wordLengthMap] = await generate(args)

  const wordsFile = fs.createWriteStream(args.out)
  const json = JSON.stringify(wordLengthMap, null, 2)
  wordsFile.write(json)

  const stats = buildWordLengthStats(wordLengthMap)
  console.log('word lengths:\n', stats)
  console.log(`wrote ${words.size} words to ${args.out}`)
}

if (!module.parent) {
  main()
}
