import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const instructions = 'The above code was taken from my codebase at https://github.com/jointhealliance/bgent. You are writing tests and documentation for my codebase. Please use the above code as a reference. Tests should be written with Jest and Typescript. Do not use mocks or stubs. Keep it very simple and straightforward.'

// Patterns to ignore
const ignorePatterns = ['actionExamples.ts', 'tests', 'test', 'agents', 'goal', 'cache', 'goals', 'supabase',  'utils', 'logger', 'index', 'data', 'constants', 'templates', 'worker']

// __dirname is not defined in ES module scope, so we need to create it
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// The directory containing the TypeScript files
const directoryPath = path.join(__dirname, '../src')

// The file to which all TypeScript content will be written
const outputFile = path.join(__dirname, 'concatenated-output.ts')

// Function to check if the file path matches any ignore pattern
const shouldIgnore = (filePath) => {
    return ignorePatterns.some(pattern => filePath.includes(pattern))
}

// Function to recursively read through directories and concatenate .ts files
const readDirectory = (dirPath) => {
    let concatenatedContent = ''

    fs.readdirSync(dirPath).forEach(file => {
        const filePath = path.join(dirPath, file)

        // Check if the file or directory should be ignored
        if (shouldIgnore(filePath)) {
            console.log(`Ignoring file or directory: ${filePath}`)
            return // Skip this file or directory
        }

        const stat = fs.statSync(filePath)

        if (stat.isDirectory()) {
            // Recursively read subdirectories
            concatenatedContent += readDirectory(filePath)
        } else if (path.extname(file) === '.ts') {
            // Read and concatenate TypeScript file content
            const content = fs.readFileSync(filePath, 'utf8')
            concatenatedContent += `// File: ${filePath}\n${content}\n\n`
        }
    })

    return concatenatedContent
}

// Start reading from the root TypeScript directory
const concatenatedContent = '# START OF BGENT CODEBASE' + readDirectory(directoryPath)

// Write the concatenated content to the output file
fs.writeFileSync(outputFile, concatenatedContent + '# END OF BGENT CODEBASE\n\n' + instructions)
console.log('TypeScript files have been concatenated into:', outputFile)
