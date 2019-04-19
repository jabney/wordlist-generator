import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const fileStats = promisify(fs.stat)
const readDirectory = promisify(fs.readdir)

export async function isDirectory(fileOrDir: string) {
  const stats = await fileStats(fileOrDir)
  return stats.isDirectory()
}

/**
 * Return a list of paths for a file or directory.
 *
 * @param fileOrDir
 */
export async function paths(fileOrDir: string) {
  const isDir = await isDirectory(fileOrDir)

  if (isDir) {
    const names = await readDirectory(fileOrDir)
    return names.map(n => path.join(fileOrDir, n))
  }

  return [fileOrDir]
}

/**
 * Return a list of full paths for a list of files and directories.
 *
 * @param filePaths
 */
export async function allPaths(filePaths: string[]) {
  const pathList: string[] = []

  for (const p of filePaths) {
    const _paths = await paths(p)
    pathList.push.apply(pathList, _paths)
  }

  return pathList
}
