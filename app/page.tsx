export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card-retro max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold mb-4 font-mono">FOOTMANAGER 98</h1>
        <p className="mb-8">Um jogo de gerenciamento de futebol inspirado nos clássicos</p>
        <div className="flex gap-4 justify-center">
          <button className="btn-primary">NOVO JOGO</button>
          <button className="btn-retro">CARREGAR</button>
        </div>
      </div>
    </main>
  )
}