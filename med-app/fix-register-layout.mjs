import { readFileSync, writeFileSync } from 'fs'

const path = 'src/app/(auth)/register/page.tsx'
const lines = readFileSync(path, 'utf8').split('\n')

lines.forEach((line, i) => {
  if (line.includes('padding: 48px 44px; display: flex; flex-direction: column; justify-content: space-between;')) {
    lines[i] = line.replace(
      'padding: 48px 44px; display: flex; flex-direction: column; justify-content: space-between;',
      'padding: 48px 44px; display: flex; flex-direction: column; justify-content: flex-start; gap: 40px;'
    )
    console.log(`fixed line ${i + 1}`)
  }
})

writeFileSync(path, lines.join('\n'), 'utf8')
console.log('done')