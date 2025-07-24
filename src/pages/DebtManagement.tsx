import { useState } from 'react';
import { ArrowLeft, Plus, CreditCard, Building2, Trash2, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function DebtManagement() {
  const navigate = useNavigate();
  const { 
    players, 
    debts, 
    addDebt, 
    repayDebt, 
    removeDebt 
  } = useGameStore();
  
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState('');
  const [selectedCreditor, setSelectedCreditor] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [repayAmounts, setRepayAmounts] = useState<{ [key: string]: string }>({});

  // 获取债权人名称（包括银行）
  const getCreditorName = (creditorId: string) => {
    if (creditorId === 'bank') return '银行';
    const player = players.find(p => p.id === creditorId);
    return player?.name || '未知';
  };

  // 获取债务人名称
  const getDebtorName = (debtorId: string) => {
    const player = players.find(p => p.id === debtorId);
    return player?.name || '未知';
  };

  // 获取玩家颜色
  const getPlayerColor = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.color || '#666';
  };

  // 添加新欠款
  const handleAddDebt = () => {
    if (!selectedDebtor || !selectedCreditor || !debtAmount) {
      toast.error('请填写完整的欠款信息');
      return;
    }
    
    if (selectedDebtor === selectedCreditor) {
      toast.error('债务人和债权人不能是同一人');
      return;
    }
    
    const amount = parseFloat(debtAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('请输入有效的欠款金额');
      return;
    }
    
    addDebt(selectedDebtor, selectedCreditor, amount);
    toast.success('欠款记录已添加');
    
    // 重置表单
    setSelectedDebtor('');
    setSelectedCreditor('');
    setDebtAmount('');
    setShowAddDebt(false);
  };

  // 全部偿还
  const handleFullRepay = (debtId: string) => {
    repayDebt(debtId);
    toast.success('债务已全部偿还');
  };

  // 部分偿还
  const handlePartialRepay = (debtId: string) => {
    const amount = parseFloat(repayAmounts[debtId] || '0');
    if (isNaN(amount) || amount <= 0) {
      toast.error('请输入有效的偿还金额');
      return;
    }
    
    const debt = debts.find(d => d.id === debtId);
    if (!debt) return;
    
    if (amount > debt.remainingAmount) {
      toast.error('偿还金额不能超过剩余欠款');
      return;
    }
    
    repayDebt(debtId, amount);
    toast.success(`已偿还 ¥${amount.toFixed(2)}`);
    setRepayAmounts({ ...repayAmounts, [debtId]: '' });
  };

  // 删除债务记录
  const handleRemoveDebt = (debtId: string) => {
    if (window.confirm('确定要删除这条债务记录吗？')) {
      removeDebt(debtId);
      toast.success('债务记录已删除');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold">欠债管理</h1>
          </div>
          <button
            onClick={() => setShowAddDebt(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus size={16} />
            新增欠款
          </button>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-4">
        {/* 债务列表 */}
        {debts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
            <p>暂无债务记录</p>
            <p className="text-sm">点击上方按钮添加新的欠款记录</p>
          </div>
        ) : (
          debts.map((debt) => {
            const debtorName = getDebtorName(debt.debtorId);
            const creditorName = getCreditorName(debt.creditorId);
            const debtorColor = getPlayerColor(debt.debtorId);
            const isBank = debt.creditorId === 'bank';
            
            return (
              <div key={debt.id} className="bg-white rounded-xl p-4 shadow-sm">
                {/* 债务信息 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: debtorColor }}
                    >
                      {debtorName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{debtorName}</span>
                        <span className="text-gray-500">欠</span>
                        {isBank ? (
                          <div className="flex items-center gap-1">
                            <Building2 size={16} className="text-blue-600" />
                            <span className="font-medium text-blue-600">{creditorName}</span>
                          </div>
                        ) : (
                          <span className="font-medium">{creditorName}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        原始金额: ¥{debt.originalAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveDebt(debt.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                {/* 剩余金额 */}
                <div className="mb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      ¥{debt.remainingAmount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">剩余未还</div>
                  </div>
                </div>
                
                {/* 偿还操作 */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="偿还金额"
                      min="0.01"
                      max={debt.remainingAmount}
                      step="0.01"
                      value={repayAmounts[debt.id] || ''}
                      onChange={(e) => setRepayAmounts({ 
                        ...repayAmounts, 
                        [debt.id]: e.target.value 
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handlePartialRepay(debt.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                    >
                      部分偿还
                    </button>
                  </div>
                  <button
                    onClick={() => handleFullRepay(debt.id)}
                    className="w-full py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                  >
                    全部偿还
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* 添加欠款弹窗 */}
        {showAddDebt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold mb-4">添加新欠款</h3>
              
              <div className="space-y-4">
                {/* 债务人选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    债务人
                  </label>
                  <select
                    value={selectedDebtor}
                    onChange={(e) => setSelectedDebtor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择债务人</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 债权人选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    债权人
                  </label>
                  <select
                    value={selectedCreditor}
                    onChange={(e) => setSelectedCreditor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择债权人</option>
                    <option value="bank">🏦 银行</option>
                    {players.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 欠款金额 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    欠款金额
                  </label>
                  <input
                    type="number"
                    value={debtAmount}
                    onChange={(e) => setDebtAmount(e.target.value)}
                    placeholder="输入欠款金额"
                    min="0.01"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddDebt(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddDebt}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}