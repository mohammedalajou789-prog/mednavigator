export interface ParsedFlashcard {
  front_text: string
  back_text: string
  tags: string[]
  display_order: number
}

export interface ParsedQuizQuestion {
  question: string
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  option_e: string | null
  correct_answer: string | null
  explanation: string | null
  tags: string[]
}

export interface ParsedPYQ {
  question: string
  options: { label: string; text: string }[]
  correct_answer: string | null
  explanation: string | null
  exam_year: number | null
  exam_type: string | null
  batch_name: string | null
}

export interface ParseResult<T> {
  success: boolean
  items: T[]
  errors: { index: number; message: string }[]
}

export function parseFlashcards(raw: string): ParseResult<ParsedFlashcard> {
  const items: ParsedFlashcard[] = []
  const errors: { index: number; message: string }[] = []
  const blockRegex = /\[CARD\]([\s\S]*?)\[\/CARD\]/g
  let match
  let index = 0

  while ((match = blockRegex.exec(raw)) !== null) {
    index++
    const block = match[1].trim()
    const lines = block.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0)
    const qLine = lines.find((l: string) => l.startsWith('Q:'))
    const aLine = lines.find((l: string) => l.startsWith('A:'))

    if (!qLine) { errors.push({ index, message: `Card #${index}: Missing Q: line` }); continue }
    if (!aLine) { errors.push({ index, message: `Card #${index}: Missing A: line` }); continue }

    const front_text = qLine.replace(/^Q:\s*/, '').trim()
    const back_text = aLine.replace(/^A:\s*/, '').trim()

    if (!front_text) { errors.push({ index, message: `Card #${index}: Question is empty` }); continue }
    if (!back_text) { errors.push({ index, message: `Card #${index}: Answer is empty` }); continue }

    items.push({ front_text, back_text, tags: [], display_order: items.length })
  }

  return { success: errors.length === 0, items, errors }
}

export function parseQuizQuestions(raw: string): ParseResult<ParsedQuizQuestion> {
  const items: ParsedQuizQuestion[] = []
  const errors: { index: number; message: string }[] = []
  const blockRegex = /\[QUESTION\]([\s\S]*?)\[\/QUESTION\]/g
  let match
  let index = 0

  while ((match = blockRegex.exec(raw)) !== null) {
    index++
    const block = match[1].trim()
    const lines = block.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0)

    const optionStartIndex = lines.findIndex((l: string) => /^[A-E]\)/.test(l))
    const questionLines = optionStartIndex > 0 ? lines.slice(0, optionStartIndex) : []
    const question = questionLines.join(' ').trim()

    if (!question) { errors.push({ index, message: `Question #${index}: Missing question text` }); continue }

    const getOption = (letter: string): string | null => {
      const line = lines.find((l: string) => l.startsWith(`${letter})`))
      return line ? line.replace(/^[A-E]\)\s*/, '').trim() || null : null
    }

    const correctLine = lines.find((l: string) => l.startsWith('CORRECT:'))
    const correct_answer = correctLine ? correctLine.replace(/^CORRECT:\s*/, '').trim().toUpperCase() || null : null

    if (!correct_answer) { errors.push({ index, message: `Question #${index}: Missing CORRECT: field` }); continue }

    const explIndex = lines.findIndex((l: string) => l.startsWith('EXPLANATION:'))
    let explanation: string | null = null
    if (explIndex !== -1) {
      explanation = lines[explIndex].replace(/^EXPLANATION:\s*/, '').trim() || null
    }

    items.push({
      question,
      option_a: getOption('A'),
      option_b: getOption('B'),
      option_c: getOption('C'),
      option_d: getOption('D'),
      option_e: getOption('E'),
      correct_answer,
      explanation,
      tags: [],
    })
  }

  return { success: errors.length === 0, items, errors }
}

export function parsePYQ(raw: string): ParseResult<ParsedPYQ> {
  const items: ParsedPYQ[] = []
  const errors: { index: number; message: string }[] = []
  const blockRegex = /\[PYQ\]([\s\S]*?)\[\/PYQ\]/g
  let match
  let index = 0

  while ((match = blockRegex.exec(raw)) !== null) {
    index++
    const block = match[1].trim()
    const lines = block.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0)

    const getValue = (key: string): string | null => {
      const line = lines.find((l: string) => l.startsWith(`${key}:`))
      return line ? line.replace(`${key}:`, '').trim() || null : null
    }

    const batch_name_raw = getValue('BATCH')
    const exam_year_raw = getValue('EXAM_YEAR')
    const exam_type_raw = getValue('EXAM_TYPE')

    const qLineIndex = lines.findIndex((l: string) => l.startsWith('QUESTION:'))
    const optionStart = lines.findIndex((l: string) => /^[A-E]\)/.test(l))

    let question = ''
    if (qLineIndex !== -1) {
      const qFirstLine = lines[qLineIndex].replace(/^QUESTION:\s*/, '').trim()
      const qExtraLines: string[] = [qFirstLine]
      const endIdx = optionStart > qLineIndex ? optionStart : lines.length
      for (let i = qLineIndex + 1; i < endIdx; i++) {
        if (lines[i].startsWith('CORRECT:') || lines[i].startsWith('EXPLANATION:')) break
        qExtraLines.push(lines[i])
      }
      question = qExtraLines.join(' ').trim()
    }

    if (!question) { errors.push({ index, message: `PYQ #${index}: Missing QUESTION: field` }); continue }

    const getOption = (letter: string) => {
      const line = lines.find((l: string) => l.startsWith(`${letter})`))
      return line ? line.replace(/^[A-E]\)\s*/, '').trim() : ''
    }

    const options = ['A', 'B', 'C', 'D', 'E']
      .map(letter => ({ label: letter, text: getOption(letter) }))
      .filter(o => o.text.length > 0)

    const correctLine = lines.find((l: string) => l.startsWith('CORRECT:'))
    const correct_answer = correctLine ? correctLine.replace(/^CORRECT:\s*/, '').trim().toUpperCase() || null : null

    if (!correct_answer) { errors.push({ index, message: `PYQ #${index}: Missing CORRECT: field` }); continue }

    const explIndex = lines.findIndex((l: string) => l.startsWith('EXPLANATION:'))
    let explanation: string | null = null
    if (explIndex !== -1) {
      explanation = lines[explIndex].replace(/^EXPLANATION:\s*/, '').trim() || null
    }

    items.push({
      question,
      options,
      correct_answer,
      explanation,
      exam_year: exam_year_raw ? parseInt(exam_year_raw, 10) || null : null,
      exam_type: exam_type_raw ? exam_type_raw.toLowerCase() : null,
      batch_name: batch_name_raw ?? null,
    })
  }

  return { success: errors.length === 0, items, errors }
}