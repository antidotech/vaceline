#! /usr/bin/env node

const fs = require('fs')
const path = require('path')
const assert = require('assert')
const { promisify } = require('util')

const yargs = require('yargs')
const mkdirp = require('mkdirp')
const debug = require('debug')

const writeFile = promisify(fs.writeFile)

const { parse, generate } = require('./dist')

/* @type {import('yargs').Configuration} */
const opts = yargs
  .scriptName('vaceline')
  .locale('en')
  .usage('$0 [source]', 'transpile VCL', (y) =>
    y.positional('source', {
      type: 'string',
      desc: 'Source file/dir to transpile',
    })
  )
  .option('ast', { type: 'boolean', desc: 'Output as AST' })
  .option('d', {
    type: 'string',
    alias: 'out-dir',
    desc: 'Output dir',
    coerce: path.resolve,
  })
  // .option('o', {
  //   type: 'string',
  //   alias: 'out-file',
  //   desc: 'Output File',
  //   coerce: path.resolve,
  // })
  .option('stdin', {
    type: 'boolean',
    desc: 'Accept input from stdin',
  })
  .option('debug', {
    desc: 'Enable debug logging',
  })
  .parse()

const utils = {
  flat: (arr) => arr.reduce((acc, val) => acc.concat(val), []),
  // readdir recursively
  readdirr: (dirPath) =>
    fs.statSync(dirPath).isDirectory()
      ? utils.flat(
          fs
            .readdirSync(dirPath)
            .map((p) => utils.readdirr(path.join(dirPath, p)))
        )
      : dirPath,
}

const main = async () => {
  if (opts.debug === true) {
    debug.enable('vaceline:*')
  } else if (typeof opts.debug === 'string') {
    debug.enable(`vaceline:${opts.debug}:*`)
  }

  let paths

  if (opts.stdin) {
    assert(!opts.source, '`source` must not be present')
    paths = ['/dev/stdin']
  }

  if (opts.source) {
    const inputPath = path.resolve(opts.source)
    assert(fs.existsSync(inputPath), 'File not found: ' + inputPath)

    paths = fs.statSync(inputPath).isDirectory()
      ? utils.readdirr(inputPath)
      : [inputPath]
  }

  assert(paths !== undefined, 'source path or --stdin option must be present')

  const ast = paths.map((filePath) => {
    const readablePath =
      filePath === '/dev/stdin'
        ? 'stdin'
        : path.relative(path.resolve(), filePath)

    console.time(readablePath)
    const ast = parse(fs.readFileSync(filePath, 'utf8'), filePath)
    console.timeEnd(readablePath)

    return ast
  })

  assert(
    Array.isArray(ast) && ast.length > 0,
    'No parsing executed due to unexpected reason'
  )

  if (opts.ast) {
    console.error(JSON.stringify(ast, null, 2))
    process.exit()
  }

  const output =
    ast.length > 1 ? ast.map((a) => generate(a).code) : generate(ast[0]).code

  if (opts.outDir) {
    if (!fs.existsSync(opts.outDir)) mkdirp(opts.outDir)

    if (Array.isArray(ast)) {
      await Promise.all(
        ast.map((a) => writeFile(path.join(opts.outDir, a.filePath), output))
      )
    } else {
      fs.writeFileSync(path.join(opts.outDir, ast.filePath), output)
    }

    process.exit()
  }

  // if (opts.outFile) {
  //   fs.writeFileSync(opts.outFile, output)
  //   process.exit()
  // }

  console.error(output)
  process.exit()
}

const logError = (err) => console.error(err.stack)
process.on('uncaughtException', logError)
process.on('unhandledRejection', logError)

main()
