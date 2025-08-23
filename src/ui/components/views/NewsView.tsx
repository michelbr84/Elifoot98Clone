'use client'

import { useState } from 'react'
import dayjs from 'dayjs'
import ptBr from 'dayjs/locale/pt-br'

dayjs.locale(ptBr)

interface NewsItem {
  id: string
  date: Date
  type: 'match' | 'injury' | 'suspension' | 'transfer' | 'finance' | 'general'
  title: string
  content: string
  clubId?: string
}

interface NewsViewProps {
  news: NewsItem[]
  clubId: string
}

export function NewsView({ news, clubId }: NewsViewProps) {
  const [filterType, setFilterType] = useState<string>('all')

  const filteredNews = filterType === 'all' 
    ? news 
    : filterType === 'myclub'
    ? news.filter(n => n.clubId === clubId)
    : news.filter(n => n.type === filterType)

  const getNewsIcon = (type: string) => {
    switch (type) {
      case 'match': return '⚽'
      case 'injury': return '🏥'
      case 'suspension': return '🟥'
      case 'transfer': return '💼'
      case 'finance': return '💰'
      default: return '📰'
    }
  }

  const getNewsColor = (type: string) => {
    switch (type) {
      case 'match': return 'text-green-600'
      case 'injury': return 'text-red-600'
      case 'suspension': return 'text-orange-600'
      case 'transfer': return 'text-blue-600'
      case 'finance': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-retro">
        <h2 className="text-2xl font-bold mb-4 font-mono">NOTÍCIAS</h2>
        
        {/* Filters */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            className={`px-3 py-1 ${filterType === 'all' ? 'btn-primary' : 'btn-retro'}`}
            onClick={() => setFilterType('all')}
          >
            TODAS
          </button>
          <button
            className={`px-3 py-1 ${filterType === 'myclub' ? 'btn-primary' : 'btn-retro'}`}
            onClick={() => setFilterType('myclub')}
          >
            MEU CLUBE
          </button>
          <button
            className={`px-3 py-1 ${filterType === 'match' ? 'btn-primary' : 'btn-retro'}`}
            onClick={() => setFilterType('match')}
          >
            PARTIDAS
          </button>
          <button
            className={`px-3 py-1 ${filterType === 'injury' ? 'btn-primary' : 'btn-retro'}`}
            onClick={() => setFilterType('injury')}
          >
            LESÕES
          </button>
          <button
            className={`px-3 py-1 ${filterType === 'transfer' ? 'btn-primary' : 'btn-retro'}`}
            onClick={() => setFilterType('transfer')}
          >
            MERCADO
          </button>
        </div>

        {/* News List */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredNews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma notícia disponível
            </div>
          ) : (
            filteredNews.map((item) => (
              <div 
                key={item.id} 
                className="border-2 border-black p-3 bg-white hover:bg-retro-gray transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`text-2xl ${getNewsColor(item.type)}`}>
                    {getNewsIcon(item.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm uppercase">
                        {item.title}
                      </h3>
                      <span className="text-xs font-mono text-gray-600">
                        {dayjs(item.date).format('DD/MM HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm">
                      {item.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* News Summary */}
      <div className="card-retro">
        <h3 className="text-lg font-bold mb-2 font-mono">RESUMO</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-mono">Total de Notícias:</span> {news.length}
          </div>
          <div>
            <span className="font-mono">Últimas 24h:</span> {
              news.filter(n => dayjs().diff(dayjs(n.date), 'hours') < 24).length
            }
          </div>
          <div>
            <span className="font-mono">Sobre seu clube:</span> {
              news.filter(n => n.clubId === clubId).length
            }
          </div>
          <div>
            <span className="font-mono">Lesões na liga:</span> {
              news.filter(n => n.type === 'injury').length
            }
          </div>
        </div>
      </div>
    </div>
  )
}