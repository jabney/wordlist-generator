import readStreams from './read-streams'

/**
 * Determine if the given word is a pattern word, i.e.,
 * contains the '*' character and only the letters
 * [a-z] with no spaces.
 */
function isPatternWord(word: string) {
  return /[*]/g.test(word) && /^[a-z*]+$/gi.test(word)
}

/**
 * Generate a set of exclude words from the given paths.
 */
async function genExcludeSet(paths: string[]) {
  const set = new Set<string>()

  await readStreams(paths, (word) => {
    // Remove spaces in words and convert to lower case.
    word = word.toLowerCase().replace(/ +/, '')
    // Only include words that are purely alphabetical.
    const accepted = /^[a-z]+$/.test(word) && word

    if (accepted) {
      // Add the accepted word to the set.
      set.add(word)
    }
  })

  return set
}

/**
 *
 */
function patternize(patternWord: string) {
  //                  start             end     somewhere in the middle
  // --------------------v----------------v-------v--------------------
  const reReplace = /^([a-z]+)[*]$|^[*]([a-z]+)$|[*]/gi
  // Replace occurrences of '*' with a regex global pattern matcher.
  const pattern = patternWord.replace(reReplace, (match, start, end) => {
    // Word at beginning of string followed by '*'.
    if (start) {
      return `^${start}.*?`
    }

    // Word at end of string preceded by '*'.
    if (end) {
      return `.+?${end}$`
    }

    // Pattern character somewhere in the middle.
    return `.*?`
  })

  return pattern
}

/**
 *
 */
async function genExcludePattern(paths: string[]) {
  const set = new Set<string>()

  await readStreams(paths, (word) => {
    // Remove spaces in words and convert to lower case.
    word = word.toLowerCase()

    // Check if we have a pattern word.
    if (isPatternWord(word)) {
      const pattern = patternize(word)
      // Add the pattern to the set.
      set.add(pattern.toLowerCase())
    }
  })

  // Create a regex from the pattern set.
  return new RegExp([...set].join('|'))
}

/**
 *
 */
async function getExcludeFilter(excludePaths: string[]) {
  // Generate the exclude set.
  const excludeSet = await genExcludeSet(excludePaths)

  // Generate the exclude pattern regex.
  const excludePattern = await genExcludePattern(excludePaths)

  // Create a filter function that returns true for rejected words.
  return function (word: string) {
    return excludeSet.has(word) || excludePattern.test(word)
  }
}

export { getExcludeFilter as excludeFilter }
