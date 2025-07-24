import { useState } from 'react';
import { ArrowLeft, Plus, Minus, Edit2, Trash2, UserPlus, RotateCcw, DollarSign, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function PlayerManagement() {
  const navigate = useNavigate();
  const { 
    players, 
    stocks, 
    updatePlayer, 
    updatePlayerStocks, 
    updatePlayerCash,
    sellStocks,
    cashOutStocks,
    removePlayer, 
    addPlayer, 
    getPlayerTotalValue,
    resetToDefaultPlayers 
  } = useGameStore();
  
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerColor, setNewPlayerColor] = useState('#FF6B6B');
  const [stockInputs, setStockInputs] = useState<{ [key: string]: string }>({});
  const [cashOutInputs, setCashOutInputs] = useState<{ [key: string]: string }>({});
  const [lastSellEarnings, setLastSellEarnings] = useState<{ [key: string]: number }>({});

  // 可选颜色
  const availableColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  // 开始编辑玩家名称
  const startEditPlayer = (playerId: string, currentName: string) => {
    setEditingPlayer(playerId);
    setEditName(currentName);
  };

  // 保存玩家名称
  const savePlayerName = (playerId: string) => {
    if (editName.trim()) {
      updatePlayer(playerId, { name: editName.trim() });
      toast.success('玩家名称已更新');
    }
    setEditingPlayer(null);
    setEditName('');
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingPlayer(null);
    setEditName('');
  };

  // 更新玩家股票
  const handleStockChange = (playerId: string, stockType: 'property' | 'education', change: number) => {
    updatePlayerStocks(playerId, stockType, change);
    const player = players.find(p => p.id === playerId);
    const stockName = stocks[stockType].name;
    if (change > 0) {
      toast.success(`${player?.name} 增加了 ${change} 股 ${stockName}`);
    } else {
      toast.success(`${player?.name} 减少了 ${Math.abs(change)} 股 ${stockName}`);
    }
  };

  // 处理输入框股票变更
  const handleStockInputChange = (playerId: string, stockType: 'property' | 'education', isIncrease: boolean) => {
    const inputKey = `${playerId}-${stockType}`;
    const inputValue = stockInputs[inputKey] || '0';
    const amount = parseInt(inputValue);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('请输入有效的股票数量');
      return;
    }
    
    const player = players.find(p => p.id === playerId);
    const currentStocks = player?.stocks[stockType] || 0;
    
    if (!isIncrease && amount > currentStocks) {
      toast.error('减少数量不能超过当前持有数量');
      return;
    }
    
    if (isIncrease) {
      handleStockChange(playerId, stockType, amount);
    } else {
      // 卖出股票，显示收益
      const earnings = sellStocks(playerId, stockType, amount);
      const stockName = stocks[stockType].name;
      setLastSellEarnings({ ...lastSellEarnings, [`${playerId}-${stockType}`]: earnings });
      toast.success(`${player?.name} 卖出 ${amount} 股 ${stockName}，获得 ¥${earnings.toFixed(2)}`);
      
      // 3秒后清除收益显示
      setTimeout(() => {
        setLastSellEarnings(prev => {
          const newState = { ...prev };
          delete newState[`${playerId}-${stockType}`];
          return newState;
        });
      }, 3000);
    }
    
    setStockInputs({ ...stockInputs, [inputKey]: '' });
  };

  // 删除玩家
  const handleRemovePlayer = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (window.confirm(`确定要删除玩家 ${player?.name} 吗？`)) {
      removePlayer(playerId);
      toast.success('玩家已删除');
    }
  };

  // 添加新玩家
  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      addPlayer({
        name: newPlayerName.trim(),
        color: newPlayerColor,
        cash: 0,
        stocks: { property: 0, education: 0 }
      });
      toast.success('新玩家已添加');
      setNewPlayerName('');
      setShowAddPlayer(false);
    } else {
      toast.error('请输入玩家名称');
    }
  };

  // 重置为默认玩家
  const handleResetToDefault = () => {
    if (window.confirm('确定要重置为默认玩家吗？这将清除所有当前玩家数据。')) {
      resetToDefaultPlayers();
      toast.success('已重置为默认玩家');
    }
  };



  // 处理股票提现
  const handleCashOut = (playerId: string) => {
    const inputKey = `cashout-${playerId}`;
    const inputValue = cashOutInputs[inputKey] || '';
    const amount = parseFloat(inputValue);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('请输入有效的提现金额');
      return;
    }
    
    const player = players.find(p => p.id === playerId);
    const totalValue = getPlayerTotalValue(playerId);
    
    if (amount > totalValue) {
      toast.error('提现金额不能超过股票总价值');
      return;
    }
    
    try {
      cashOutStocks(playerId, amount);
      toast.success(`${player?.name} 成功提现 ¥${amount.toFixed(2)}`);
      // 清空输入框
      setCashOutInputs({ ...cashOutInputs, [inputKey]: '' });
    } catch (error) {
      toast.error('提现失败，请检查股票余额');
    }
  };

  // 处理现金调整（通过卖出股票获得现金）
  const handleCashAdjustment = (playerId: string, amount: number) => {
    const player = players.find(p => p.id === playerId);
    const totalValue = getPlayerTotalValue(playerId);
    
    if (amount > totalValue) {
      toast.error('股票价值不足，无法获得该金额');
      return;
    }
    
    try {
      cashOutStocks(playerId, amount);
      toast.success(`${player?.name} 通过卖出股票获得现金 ¥${amount.toFixed(2)}`);
    } catch (error) {
      toast.error('操作失败，请检查股票余额');
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
            <h1 className="text-xl font-semibold">玩家管理</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleResetToDefault}
              className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <RotateCcw size={16} />
              重置默认
            </button>
            <button
              onClick={() => setShowAddPlayer(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <UserPlus size={16} />
              添加玩家
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-4">
        {/* 玩家列表 */}
        {players.map((player) => {
          const totalValue = getPlayerTotalValue(player.id);
          
          return (
            <div key={player.id} className="bg-white rounded-xl p-4 shadow-sm">
              {/* 玩家信息 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full" 
                    style={{ backgroundColor: player.color }}
                  />
                  {editingPlayer === player.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && savePlayerName(player.id)}
                        autoFocus
                      />
                      <button
                        onClick={() => savePlayerName(player.id)}
                        className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                      >
                        保存
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-semibold">{player.name}</h3>
                      <p className="text-sm text-gray-600">股票提现金额: ¥{player.cash.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">总资产: ¥{(totalValue + player.cash).toFixed(2)}</p>
                    </div>
                  )}
                </div>
                
                {editingPlayer !== player.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditPlayer(player.id, player.name)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleRemovePlayer(player.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* 现金管理 */}
              <div className="border border-gray-200 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <DollarSign size={16} />
                      提现计算
                    </h4>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {/* 提现功能 */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="从股票账户提现金额"
                        min="0.01"
                        step="0.01"
                        value={cashOutInputs[`cashout-${player.id}`] || ''}
                        onChange={(e) => setCashOutInputs({ 
                          ...cashOutInputs, 
                          [`cashout-${player.id}`]: e.target.value 
                        })}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleCashOut(player.id)}
                        className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors flex items-center gap-1"
                      >
                        <Banknote size={14} />
                        股票提现
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      股票价值: ¥{totalValue.toFixed(2)} (提现将按市价卖出相应股票)
                    </p>
                  </div>
                  
                  {/* 现金调整按钮 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCashAdjustment(player.id, 1000)}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                    >
                      +¥1000
                    </button>
                    <button
                      onClick={() => handleCashAdjustment(player.id, 2000)}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                    >
                      +¥2000
                    </button>
                    <button
                      onClick={() => handleCashAdjustment(player.id, 3000)}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                    >
                      +¥3000
                    </button>
                    <button
                      onClick={() => handleCashAdjustment(player.id, 5000)}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                    >
                      +¥5000
                    </button>
                  </div>
                </div>
              </div>

              {/* 股票持有情况 */}
              <div className="space-y-3">
                {Object.entries(stocks).map(([stockType, stock]) => {
                  const holdingCount = player.stocks[stockType as 'property' | 'education'];
                  const holdingValue = holdingCount * stock.price;
                  const earningsKey = `${player.id}-${stockType}`;
                  const earnings = lastSellEarnings[earningsKey];
                  
                  return (
                    <div key={stockType} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{stock.name}</h4>
                          <p className="text-sm text-gray-600">
                            持有: {holdingCount} 股 | 价值: ¥{holdingValue.toFixed(2)}
                          </p>
                          {earnings && (
                            <p className="text-sm text-green-600 font-medium">
                              卖出收益: +¥{earnings.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-center font-medium">
                          {holdingCount} 股
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="数量"
                            min="1"
                            value={stockInputs[`${player.id}-${stockType}`] || ''}
                            onChange={(e) => setStockInputs({ 
                              ...stockInputs, 
                              [`${player.id}-${stockType}`]: e.target.value 
                            })}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleStockInputChange(player.id, stockType as 'property' | 'education', false)}
                            disabled={holdingCount <= 0}
                            className={cn(
                              'px-3 py-1 rounded text-sm transition-colors',
                              holdingCount <= 0
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-red-500 text-white hover:bg-red-600'
                            )}
                          >
                            减少
                          </button>
                          <button
                            onClick={() => handleStockInputChange(player.id, stockType as 'property' | 'education', true)}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                          >
                            增加
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* 添加玩家弹窗 */}
        {showAddPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold mb-4">添加新玩家</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    玩家名称
                  </label>
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="输入玩家名称"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择颜色
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewPlayerColor(color)}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all',
                          newPlayerColor === color
                            ? 'border-gray-800 scale-110'
                            : 'border-gray-300 hover:scale-105'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddPlayer(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddPlayer}
                  className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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