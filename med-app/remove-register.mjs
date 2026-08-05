import { readFileSync, writeFileSync } from 'fs'

const path = 'src/app/page.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

let registerStart = -1
let registerEnd = -1

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('href="/register"') && lines[i].includes('Register')) {
    registerStart = i
  }
  if (registerStart !== -1 && i > registerStart && lines[i].includes('</Link>')) {
    registerEnd = i
    break
  }
}

console.log(`Register button: lines ${registerStart + 1} to ${registerEnd + 1}`)

const result = [
  ...lines.slice(0, registerStart),
  ...lines.slice(registerEnd + 1)
].join('\n')

writeFileSync(path, result, 'utf8')
console.log('done')