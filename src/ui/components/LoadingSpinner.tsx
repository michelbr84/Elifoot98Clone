export function LoadingSpinner({ text = 'Carregando...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-retro-gray rounded-full animate-spin border-t-retro-green"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-retro-dark rounded-full"></div>
        </div>
      </div>
      <p className="mt-4 text-lg font-mono animate-pulse">{text}</p>
    </div>
  )
}