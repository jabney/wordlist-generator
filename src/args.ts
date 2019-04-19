/**
 * Parse command-line arguments
 */
import regexEach from 'regex-each'

// Define tokens used by the parser.
const tChar = String.raw`[^- ]`
const tArg = String.raw`--${tChar}+|-${tChar}+`
const tVal = String.raw`${tChar}+`

// Create the parser.
const tParser = String.raw`(?:\s+|^)(?:(${tArg})|(${tVal}))(?=\s|$)`
const parser = new RegExp(tParser, 'yi')

// Thrown when an alias is not found for an argument.
class AliasError extends Error {
  constructor(name: string, alias: string) {
    super(`alias not found for "${name}:${alias}"`)
  }
}

// Thrown for errors that should ouptut a help message.
class HelpException extends Error {
  constructor(message?: string|null) {
    super(message || undefined)
  }
}

interface IContext {
  name: string
  values: string[]
}

type SchemaEntry = 'str'|'int'|'float'|'bool'|'enum'

export interface ISchemaEntry {
  type?: SchemaEntry
  name?: string
  num?: number
  alias?: string
  desc?: string
  required?: boolean
  default?: any
  values?: any
}

export interface ISchema {
  [name: string]: ISchemaEntry
}

export interface IInfo {
  command: string
  description: string
}

export interface IParseArgs {
  [name: string]: any|any[]
}

type SchemaMap = Map<string, ISchemaEntry>

/**
 *
 */
function schemaToMap(schema?: ISchema|null): SchemaMap|null {
  if (schema != null) {
    return new Map(Object.entries(schema))
  }
  return null
}

/**
 *
 */
function helpMessage(message: string|null, info?: IInfo|null, schema?: ISchema|null) {
  const cmd = info && info.command || 'command'
  const desc = info && info.description

  const msg: string[] = []

  if (message) {
    msg.push(message, '\n\n')
  }

  if (desc != null) {
    msg.push(`${desc}\n`)
  }

  // if (schema != null) {
  //   const msg: string[] = [cmd]

  //   const def = schema.$default

  //   if (def != null) {
  //     const name = def.name || 'arg'

  //     msg.push(def.required ? name : `[${name}]`)
  //   }
  // }

  return msg.join('')
}

/**
 * Get the 'proper' name of an argument by trying to get
 * it from the schema.
 */
function getProperName(name: string, schema?: SchemaMap|null) {
  const entry = schema && schema.get(name)

  // If there's no schema entry for the name, throw.
  if (entry == null) {
    throw new HelpException(`invalid argument "${name}"`)
  }

  // If the entry has an alias, get the name from the alias.
  if (entry.alias != null) {
    const _entry = schema && schema.get(entry.alias)

    // Couldn't find the entry from the alias.
    if (_entry == null) {
      throw new AliasError(name, entry.alias)
    }

    // Return the alias name.
    return entry.alias
  }

  // There was no alias, so return the original name.
  return name
}

/**
 *
 */
function handleArg(arg: string, info?: IInfo|null, schema?: SchemaMap|null): IContext {
  // Remove leading dashes from the name.
  let name = arg.replace(/-+/, '')

  // On any help flag, log the help message and return
  if (['help', 'h'].includes(name)) {
    throw new HelpException(null)
  }

  // Check for a schema.
  if (schema != null) {
    // Get the proper name from the schema, if applicable.
    name = getProperName(name, schema)
  }

  return { name, values: [] }
}

/**
 *
 */
function checkValue(value: string, context: IContext, _schema?: SchemaMap|null) {
  if (_schema != null) {
    /**
     * If we have a schema, let the schema determine if
     * default arguments are defined.
     *
     * If this is the default context, yet no default schema
     * is defined, then issue an error.
     */
    if (context.name === '$default' && !_schema.has('$default')) {
      throw new HelpException(`invalid positional argument "${value}"`)
    }
  }
}

/**
 *
 */
function convert(arg: IContext, schema: SchemaMap): any|any[] {
  const _schema = schema.get(arg.name)
  if (_schema == null) {
    return arg.values
  }

  const num = _schema.num
  if (num != null && num === 1) {
    return arg.values[0]
  } else {
    return arg.values
  }
}

/**
 *
 */
function transformArgs(args: IContext[], schema?: SchemaMap|null): IParseArgs {
  // Transform argument list into a key/value object.
  const tArgs = args.reduce((map, arg) => {
    if (schema != null) {
      map[arg.name] = convert(arg, schema)
    } else {
      map[arg.name] = arg.values
    }

    return map
    }, {} as IParseArgs)

  return tArgs
}

/**
 * Parse an argument string.
 */
function parseArgs<T extends IParseArgs = IParseArgs>(
  info?: IInfo|null, schema?: ISchema|null): T|void {

  // Create a string of user-supplied command-line arguments.
  const str = process.argv.slice(2).join(' ')

  // Convert the given schema to a map object.
  const _schema = schemaToMap(schema)

  // Create the default context.
  const $default = { name: '$default', values: [] }

  // Initialize context to the defalt.
  let context: IContext = $default

  // Create the args list with initial context.
  const args: IContext[] = [context]

  // Track the regex last index for error checking later.
  let lastIndex = 0

  try {
    regexEach(parser, str, (match, regex) => {
      const [_, arg, value] = match
      // console.log(match[0])

      // Handle arguments, e.g., --something or -s.
      if (arg != null) {
        context = handleArg(arg, info, _schema)
        // Add context to args list.
        args.push(context)
      }

      // Handle values.
      if (value != null) {
        checkValue(value, context, _schema)
        // Add the value to the current context.
        context.values.push(value)
      }

      // Update to latest value from regex.
      lastIndex = regex.lastIndex
    })
  } catch (error) {
    if (error instanceof HelpException) {
      return console.error(helpMessage(error.message, info))
    }

    throw error
  }

  if (lastIndex < str.length) {
    const error = 'invalid arguments format: '
    const msg: string[] = []
    msg.push(`${error}${str}`)
    msg.push('-'.repeat(lastIndex + error.length) + '^')
    return console.error(helpMessage(msg.join('\n'), info))
  }

  return <T>transformArgs(args, _schema)
}

export { parseArgs, helpMessage }
