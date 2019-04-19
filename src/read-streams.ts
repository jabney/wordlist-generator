import fs from 'fs'
import readline from 'readline'

type LineCbk = (line: string) => void

function createStreams(paths: string[]) {
  return paths.map(path => fs.createReadStream(path))
}

function readStream(stream: fs.ReadStream, line: LineCbk) {
  return new Promise((resolve, reject) => {
    try {
      const lineReader = readline.createInterface(stream)
      lineReader.on('line', line)
      lineReader.on('close', resolve)

    } catch (e) {
      reject(e)
    }
  })
}

async function readStreamsByLine(paths: string[], line: LineCbk) {
  const streams = createStreams(paths)

  for (const stream of streams) {
    await readStream(stream, line)
  }
}

export default readStreamsByLine
