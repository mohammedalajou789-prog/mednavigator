import Link from 'next/link'

export default function AdminDocsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Documentation Center</h1>
        <p className="text-gray-500 mt-1">Complete reference guide for content creation on MedNavigator.</p>
      </div>

      {/* Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {[
          { label: 'MN Syntax', href: '#mn-syntax' },
          { label: 'Bulk Import', href: '#bulk-import' },
          { label: 'Image Slots', href: '#image-slots' },
          { label: 'Content Rules', href: '#content-rules' },
        ].map(item => (
          
            key={item.href}
            href={item.href}
            className="px-4 py-3 text-sm font-medium text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            {item.label}
          </a>
        ))}
      </div>

      <div className="space-y-12">

        {/* MN Syntax */}
        <section id="mn-syntax">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            MN Syntax Reference
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            MN Syntax is the content language used to write Sheets and Summaries. The platform automatically converts it into formatted educational content.
          </p>

          <div className="space-y-4">

            {/* Headings */}
            <DocBlock
              title="Headings"
              description="Use # for main title, ## for sections, ### for subsections."
              code={`# Heart Failure\n\n## Definition\n\n### Etiology`}
            />

            {/* Highlight */}
            <DocBlock
              title="Highlight Block"
              description="Use for important statements that need attention."
              code={`[HIGHLIGHT]\nBNP is useful in the diagnosis of heart failure.\n[/HIGHLIGHT]`}
            />

            {/* Important */}
            <DocBlock
              title="Important Block"
              description="Use for highly tested or critical information."
              code={`[IMPORTANT]\nACE inhibitors improve survival in systolic heart failure.\n[/IMPORTANT]`}
            />

            {/* Clinical Pearl */}
            <DocBlock
              title="Clinical Pearl"
              description="Use for practical clinical insights."
              code={`[CLINICAL_PEARL]\nS3 gallop is a sign of systolic heart failure.\n[/CLINICAL_PEARL]`}
            />

            {/* Must Memorize */}
            <DocBlock
              title="Must Memorize"
              description="Use for high-yield facts students must remember."
              code={`[MUST_MEMORIZE]\nNormal EF = 55–70%\n[/MUST_MEMORIZE]`}
            />

            {/* Previous Year */}
            <DocBlock
              title="Previous Year"
              description="Use to highlight concepts that appeared in past exams."
              code={`[PREVIOUS_YEAR]\nAsked in 2024 Final Exam.\n[/PREVIOUS_YEAR]`}
            />

            {/* Table */}
            <DocBlock
              title="Table"
              description="Use for structured data."
              code={`[TABLE]\n| NYHA Class | Symptoms |\n|------------|----------|\n| I | No limitation |\n| II | Mild limitation |\n| III | Marked limitation |\n| IV | Symptoms at rest |\n[/TABLE]`}
            />

            {/* Bold and Highlight inline */}
            <DocBlock
              title="Inline Formatting"
              description="Use **text** for bold and ==text== for inline yellow highlight."
              code={`The **ejection fraction** is ==critically important== in classification.`}
            />

          </div>
        </section>

        {/* Bulk Import */}
        <section id="bulk-import">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Bulk Import Syntax
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Use the Bulk Import tab inside the Content Builder to paste multiple items at once. Each block is saved as a separate record.
          </p>

          <div className="space-y-4">

            <DocBlock
              title="Flashcards"
              description="Each card uses [CARD]...[/CARD]. Q: is the question, A: is the answer."
              code={`[CARD]\nQ: What is normal ejection fraction?\nA: 55–70%\n[/CARD]\n\n[CARD]\nQ: What is the most common cause of heart failure?\nA: Ischemic heart disease\n[/CARD]`}
            />

            <DocBlock
              title="Quiz Questions"
              description="Each question uses [QUESTION]...[/QUESTION]. CORRECT: must be A, B, C, D, or E."
              code={`[QUESTION]\nWhat is the normal ejection fraction?\nA) 20–30%\nB) 30–40%\nC) 55–70%\nD) 70–80%\nE) >80%\nCORRECT: C\nEXPLANATION: Normal EF is 55–70%.\n[/QUESTION]`}
            />

            <DocBlock
              title="Previous Year Questions"
              description="Each question uses [PYQ]...[/PYQ]. EXAM_YEAR and EXAM_TYPE are required."
              code={`[PYQ]\nEXAM_YEAR: 2025\nEXAM_TYPE: Final\nQUESTION: What is the normal ejection fraction?\nA) 20–30%\nB) 55–70%\nC) 70–80%\nD) >80%\nE) <20%\nCORRECT: B\nEXPLANATION: Normal EF is 55–70%.\n[/PYQ]`}
            />

          </div>
        </section>

        {/* Image Slots */}
        <section id="image-slots">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Image Slots
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Reserve image locations inside your content using image slots. After saving the sheet, upload images in the Image Slots section below the editor.
          </p>

          <div className="space-y-4">

            <DocBlock
              title="Basic Image Slot"
              description="Places an image placeholder at this position in the content."
              code={`[IMAGE_SLOT:1]`}
            />

            <DocBlock
              title="Image Slot with Caption"
              description="Adds a caption below the image."
              code={`[IMAGE_SLOT:1]\nECG showing atrial fibrillation\n[/IMAGE_SLOT]`}
            />

            <DocBlock
              title="Multiple Slots"
              description="Use different numbers for multiple images in the same sheet."
              code={`[IMAGE_SLOT:1]\n\nSome content here.\n\n[IMAGE_SLOT:2]\n\nMore content here.\n\n[IMAGE_SLOT:3]`}
            />

          </div>

          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-5 py-4">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">Workflow</p>
            <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
              <li>Write your content with [IMAGE_SLOT:N] placeholders</li>
              <li>Click Save Draft or Publish</li>
              <li>Scroll down to the Image Slots section</li>
              <li>Upload an image for each slot</li>
              <li>Students will see the images inline when reading</li>
            </ol>
          </div>
        </section>

        {/* Content Rules */}
        <section id="content-rules">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            Content Rules
          </h2>

          <div className="space-y-3">
            {[
              { rule: 'Never specify colors', detail: 'The platform handles all colors automatically. Never write "make this red" or use color names.' },
              { rule: 'Always close tags', detail: 'Every [TAG] must have a matching [/TAG]. Missing closing tags will cause display errors.' },
              { rule: 'One sheet per lecture', detail: 'Each lecture can have one Sheet and one Summary. Creating a second one will overwrite the first.' },
              { rule: 'Draft vs Published', detail: 'Draft content is visible only to admins. Published content is visible to students based on access level.' },
              { rule: 'Image slot numbers', detail: 'Each slot number must be unique within the same sheet. Use 1, 2, 3... in order.' },
              { rule: 'Bulk import is additive', detail: 'Bulk importing flashcards or questions adds to existing ones — it does not replace them.' },
              { rule: 'CORRECT field is required', detail: 'Every quiz question and PYQ must have a CORRECT: field. Missing it will cause the import to skip that question.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.rule}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}

function DocBlock({ title, description, code }: { title: string; description: string; code: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
      <div className="bg-slate-900 p-4">
        <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap leading-relaxed">{code}</pre>
      </div>
    </div>
  )
}