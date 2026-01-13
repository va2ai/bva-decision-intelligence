export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <main className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          BVA Decision Intelligence Platform
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Multi-agent research platform for analyzing Board of Veterans&apos; Appeals decisions
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Search & Explore</h2>
            <p className="text-gray-600">
              Search BVA decisions with hybrid full-text and semantic search
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">AI Analysis</h2>
            <p className="text-gray-600">
              Generate AI-powered briefs and analyze decision patterns
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Reports Library</h2>
            <p className="text-gray-600">
              Searchable library of reports with PDF/DOCX export
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
