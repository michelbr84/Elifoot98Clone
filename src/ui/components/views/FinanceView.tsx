'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/src/state/useGameStore'
import dayjs from 'dayjs'

interface FinanceData {
  balance: number
  monthlyIncome: number
  monthlyExpenses: number
  lastTransactions: Transaction[]
  salaryTotal: number
  averageAttendance: number
  sponsorshipValue: number
}

interface Transaction {
  id: string
  date: Date
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
}

interface FinanceViewProps {
  financeData: FinanceData
}

export function FinanceView({ financeData }: FinanceViewProps) {
  const { currentClub } = useGameStore()
  const [selectedTab, setSelectedTab] = useState<'overview' | 'transactions'>('overview')

  const formatCurrency = (value: number) => {
    return `§ ${value.toLocaleString('pt-BR')}`
  }

  const getTransactionIcon = (category: string) => {
    switch (category) {
      case 'ticket': return '🎫'
      case 'sponsor': return '🤝'
      case 'transfer': return '💰'
      case 'salary': return '💸'
      case 'maintenance': return '🔧'
      default: return '📋'
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-retro">
        <h2 className="text-2xl font-bold mb-4 font-mono">FINANÇAS - {currentClub?.name}</h2>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            className={`px-4 py-2 font-mono ${selectedTab === 'overview' ? 'btn-primary' : 'btn-retro'}`}
            onClick={() => setSelectedTab('overview')}
          >
            VISÃO GERAL
          </button>
          <button
            className={`px-4 py-2 font-mono ${selectedTab === 'transactions' ? 'btn-primary' : 'btn-retro'}`}
            onClick={() => setSelectedTab('transactions')}
          >
            TRANSAÇÕES
          </button>
        </div>

        {selectedTab === 'overview' && (
          <div className="space-y-4">
            {/* Current Balance */}
            <div className="bg-retro-bg p-4 border-2 border-black">
              <h3 className="font-mono text-sm uppercase mb-2">Saldo Atual</h3>
              <div className={`text-3xl font-bold ${financeData.balance >= 0 ? 'text-retro-green' : 'text-retro-red'}`}>
                {formatCurrency(financeData.balance)}
              </div>
            </div>

            {/* Monthly Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-100 p-4 border-2 border-green-800">
                <h4 className="font-mono text-sm uppercase mb-2">Receitas (Mês)</h4>
                <div className="text-xl font-bold text-green-800">
                  {formatCurrency(financeData.monthlyIncome)}
                </div>
              </div>
              <div className="bg-red-100 p-4 border-2 border-red-800">
                <h4 className="font-mono text-sm uppercase mb-2">Despesas (Mês)</h4>
                <div className="text-xl font-bold text-red-800">
                  {formatCurrency(financeData.monthlyExpenses)}
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2">
              <h4 className="font-mono text-sm uppercase">Detalhamento</h4>
              
              <div className="space-y-1">
                <div className="flex justify-between py-1 border-b">
                  <span>🎫 Bilheteria (média)</span>
                  <span className="font-mono">
                    {formatCurrency(financeData.averageAttendance * 50)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span>🤝 Patrocínio</span>
                  <span className="font-mono">
                    {formatCurrency(financeData.sponsorshipValue)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span>💸 Folha Salarial</span>
                  <span className="font-mono text-red-600">
                    -{formatCurrency(financeData.salaryTotal)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span>🔧 Manutenção</span>
                  <span className="font-mono text-red-600">
                    -{formatCurrency(50000)}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Health */}
            <div className="bg-retro-gray p-4 border-2 border-black">
              <h4 className="font-mono text-sm uppercase mb-2">Saúde Financeira</h4>
              <div className="flex items-center gap-2">
                {financeData.balance > financeData.salaryTotal * 3 && (
                  <>
                    <span className="text-2xl">😊</span>
                    <span className="text-green-600">Excelente</span>
                  </>
                )}
                {financeData.balance > financeData.salaryTotal && financeData.balance <= financeData.salaryTotal * 3 && (
                  <>
                    <span className="text-2xl">😐</span>
                    <span className="text-yellow-600">Regular</span>
                  </>
                )}
                {financeData.balance <= financeData.salaryTotal && (
                  <>
                    <span className="text-2xl">😰</span>
                    <span className="text-red-600">Preocupante</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'transactions' && (
          <div className="space-y-2">
            <h4 className="font-mono text-sm uppercase">Últimas Transações</h4>
            
            <div className="max-h-96 overflow-y-auto">
              <table className="table-retro w-full">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th className="text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {financeData.lastTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="font-mono text-sm">
                        {dayjs(transaction.date).format('DD/MM')}
                      </td>
                      <td className="text-center">
                        {getTransactionIcon(transaction.category)}
                      </td>
                      <td>{transaction.description}</td>
                      <td className={`text-right font-mono ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="card-retro">
        <h3 className="text-lg font-bold mb-2 font-mono">DICAS FINANCEIRAS</h3>
        <ul className="space-y-1 text-sm">
          <li>• Mantenha pelo menos 3 meses de salários em caixa</li>
          <li>• Venda jogadores com salários altos se estiver no vermelho</li>
          <li>• Invista em jogadores jovens para revender no futuro</li>
          <li>• Promoção de divisão aumenta receitas de patrocínio</li>
        </ul>
      </div>
    </div>
  )
}