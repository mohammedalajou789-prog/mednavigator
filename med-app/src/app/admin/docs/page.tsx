import Link from 'next/link'

export default function AdminDocsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Documentation Center</h1>
        <p className="text-gray-500 mt-1">Complete reference guide for content creation on MedNavigator.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {[
          { label: 'MN Syntax', href: '#mn-syntax' },
          { label: 'Bulk Import', href: '#bulk-import' },
          { label: 'Image Slots', href: '#image-slots' },
          { label: 'Content Rules', href: '#content-rules' },
        ].map(item => (
          <a key={item.href} href={item.href} className="px-4 py-3 text-sm font-medium text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-colors">
            {item.label}
          </a>
        ))}
      </div>
      <div className="space-y-12">
        <section id="mn-syntax">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">MN Syntax Reference</h2>
          <p className="text-sm text-gray-500 mb-6">MN Syntax is the content language used to write Sheets and Summaries.</p>
          <div className="space-y-4">
            <DocBlock title="Headings" description="Use # for main title, ## for sections, ### for subsections." code={"# Heart Failure\n\n## Definition\n\n### Etiology"} />
            <DocBlock title="Highlight Block" description="Use for important statements." code={"[HIGHLIGHT]\nBNP is useful in diagnosis.\n[/HIGHLIGHT]"} />
            <DocBlock title="Important Block" description="Use for highly tested information." code={"[IMPORTANT]\nACE inhibitors improve survival.\n[/IMPORTANT]"} />
            <DocBlock title="Clinical Pearl" description="Use for practical clinical insights." code={"[CLINICAL_PEARL]\nS3 gallop is a sign of systolic heart failure.\n[/CLINICAL_PEARL]"} />
            <DocBlock title="Must Memorize" description="Use for high-yield facts." code={"[MUST_MEMORIZE]\nNormal EF = 55-70%\n[/MUST_MEMORIZE]"} />
            <DocBlock title="Previous Year" description="Use to highlight past exam concepts." code={"[PREVIOUS_YEAR]\nAsked in 2024 Final Exam.\n[/PREVIOUS_YEAR]"} />
            <DocBlock title="Table" description="Use for structured data." code={"[TABLE]\n| NYHA | Symptoms |\n|------|----------|\n| I | No limitation |\n| II | Mild limitation |\n[/TABLE]"} />
            <DocBlock title="Inline Formatting" description="Use **text** for bold and ==text== for highlight." code={"The **ejection fraction** is ==critically important==."} />
          </div>
        </section>
        <section id="bulk-import">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Bulk Import Syntax</h2>
          <p className="text-sm text-gray-500 mb-6">Use the Bulk Import tab inside the Content Builder to paste multiple items at once.</p>
          <div className="space-y-4">
            <DocBlock title="Flashcards" description="Each card uses [CARD]...[/CARD]." code={"[CARD]\nQ: What is normal ejection fraction?\nA: 55-70%\n[/CARD]"} />
            <DocBlock title="Quiz Questions" description="Each question uses [QUESTION]...[/QUESTION]. CORRECT: must be A-E." code={"[QUESTION]\nWhat is normal EF?\nA) 20-30%\nB) 55-70%\nCORRECT: B\nEXPLANATION: Normal EF is 55-70%.\n[/QUESTION]"} />
            <DocBlock title="Previous Year Questions" description="Each question uses [PYQ]...[/PYQ]." code={"[PYQ]\nEXAM_YEAR: 2025\nEXAM_TYPE: Final\nQUESTION: What is normal EF?\nA) 55-70%\nCORRECT: A\nEXPLANATION: Normal EF is 55-70%.\n[/PYQ]"} />
          </div>
        </section>
        <section id="image-slots">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Image Slots</h2>
          <p className="text-sm text-gray-500 mb-6">Reserve image locations inside your content using image slots.</p>
          <div className="space-y-4">
            <DocBlock title="Basic Image Slot" description="Places an image placeholder at this position." code={"[IMAGE_SLOT:1]"} />
            <DocBlock title="Image Slot with Caption" description="Adds a caption below the image." code={"[IMAGE_SLOT:1]\nECG showing atrial fibrillation\n[/IMAGE_SLOT]"} />
          </div>
        </section>
        <section id="content-rules">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Content Rules</h2>
          <div className="space-y-3">
            {[
              { rule: 'Never specify colors', detail: 'The platform handles all colors automatically.' },
              { rule: 'Always close tags', detail: 'Every [TAG] must have a matching [/TAG].' },
              { rule: 'One sheet per lecture', detail: 'Each lecture can have one Sheet and one Summary.' },
              { rule: 'Draft vs Published', detail: 'Draft content is visible only to admins.' },
              { rule: 'Bulk import is additive', detail: 'Bulk importing adds to existing ones - it does not replace them.' },
              { rule: 'CORRECT field is required', detail: 'Every quiz question must have a CORRECT: field.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
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
