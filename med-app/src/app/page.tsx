export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h1 className="text-5xl font-bold text-slate-900 mb-6">
          MedNavigator
        </h1>

        <p className="text-xl text-slate-600 mb-10 max-w-3xl">
          Your medical education companion. Access structured learning
          resources, clinical guides, exam preparation materials, and
          evidence-based medical content in one place.
        </p>

        <div className="flex gap-4">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
            Explore Content
          </button>

          <button className="px-6 py-3 border border-slate-300 rounded-lg">
            Learn More
          </button>
        </div>
      </section>
    </main>
  );
}