import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-semibold text-foreground">
          Prismatic Prototype
        </h1>
        <p className="text-foreground/70">Start building your prototype here!</p>
        <Button>Get Started</Button>
      </div>
    </div>
  )
}

export default App
