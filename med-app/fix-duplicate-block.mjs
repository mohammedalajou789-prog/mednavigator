import { readFileSync, writeFileSync } from 'fs'

const path = 'src/app/page.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

// Find the second occurrence of mn-btns (the duplicate after footer)
let count = 0
let duplicateStart = -1
let duplicateEnd = -1

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('mn-btns') && lines[i].includes("display: 'flex'")) {
    count++
    if (count === 2) {
      duplicateStart = i
      console.log(`Found duplicate mn-btns at line ${i + 1}`)
    }
  }
  if (duplicateStart !== -1 && i > duplicateStart && lines[i].includes('mn-mobile-features') && lines[i].includes("display: 'none'")) {
    duplicateEnd = i - 1
    console.log(`Duplicate block ends at line ${duplicateEnd + 1}`)
    break
  }
}

if (duplicateStart === -1) {
  console.log('ERROR: duplicate not found')
  process.exit(1)
}

console.log('Removing lines', duplicateStart + 1, 'to', duplicateEnd + 1)

const result = [
  ...lines.slice(0, duplicateStart),
  ...lines.slice(duplicateEnd + 1)
].join('\n')

writeFileSync(path, result, 'utf8')
console.log('done')