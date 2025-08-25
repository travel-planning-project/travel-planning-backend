import React, { useState, useEffect } from 'react';
import { 
  Plane, 
  Building, 
  Utensils, 
  MapPin, 
  Car, 
  ShoppingBag, 
  MoreHorizontal,
  PieChart,
  DollarSign
} from 'lucide-react';

interface BudgetSplitterProps {
  totalBudget: number;
  onBudgetChange: (breakdown: BudgetBreakdown) => void;
}

interface BudgetBreakdown {
  flights: number;
  accommodation: number;
  food: number;
  activities: number;
  transport: number;
  shopping: number;
  miscellaneous: number;
}

const BudgetSplitter: React.FC<BudgetSplitterProps> = ({ totalBudget, onBudgetChange }) => {
  const [breakdown, setBreakdown] = useState<BudgetBreakdown>({
    flights: Math.round(totalBudget * 0.35),
    accommodation: Math.round(totalBudget * 0.30),
    food: Math.round(totalBudget * 0.15),
    activities: Math.round(totalBudget * 0.10),
    transport: Math.round(totalBudget * 0.05),
    shopping: Math.round(totalBudget * 0.03),
    miscellaneous: Math.round(totalBudget * 0.02)
  });

  const categories = [
    { 
      key: 'flights' as keyof BudgetBreakdown, 
      label: 'Flights', 
      icon: Plane, 
      color: '#3B82F6',
      gradient: 'from-blue-400 to-blue-600'
    },
    { 
      key: 'accommodation' as keyof BudgetBreakdown, 
      label: 'Hotels', 
      icon: Building, 
      color: '#10B981',
      gradient: 'from-emerald-400 to-emerald-600'
    },
    { 
      key: 'food' as keyof BudgetBreakdown, 
      label: 'Food', 
      icon: Utensils, 
      color: '#F59E0B',
      gradient: 'from-amber-400 to-amber-600'
    },
    { 
      key: 'activities' as keyof BudgetBreakdown, 
      label: 'Activities', 
      icon: MapPin, 
      color: '#EF4444',
      gradient: 'from-red-400 to-red-600'
    },
    { 
      key: 'transport' as keyof BudgetBreakdown, 
      label: 'Transport', 
      icon: Car, 
      color: '#8B5CF6',
      gradient: 'from-violet-400 to-violet-600'
    },
    { 
      key: 'shopping' as keyof BudgetBreakdown, 
      label: 'Shopping', 
      icon: ShoppingBag, 
      color: '#EC4899',
      gradient: 'from-pink-400 to-pink-600'
    },
    { 
      key: 'miscellaneous' as keyof BudgetBreakdown, 
      label: 'Other', 
      icon: MoreHorizontal, 
      color: '#6B7280',
      gradient: 'from-gray-400 to-gray-600'
    }
  ];

  const totalAllocated = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const remaining = totalBudget - totalAllocated;

  useEffect(() => {
    onBudgetChange(breakdown);
  }, [breakdown, onBudgetChange]);

  const handleBudgetChange = (category: keyof BudgetBreakdown, value: number) => {
    setBreakdown(prev => ({
      ...prev,
      [category]: Math.max(0, value)
    }));
  };

  const getPercentage = (amount: number) => {
    return totalBudget > 0 ? ((amount / totalBudget) * 100).toFixed(1) : '0';
  };

  const resetToDefaults = () => {
    setBreakdown({
      flights: Math.round(totalBudget * 0.35),
      accommodation: Math.round(totalBudget * 0.30),
      food: Math.round(totalBudget * 0.15),
      activities: Math.round(totalBudget * 0.10),
      transport: Math.round(totalBudget * 0.05),
      shopping: Math.round(totalBudget * 0.03),
      miscellaneous: Math.round(totalBudget * 0.02)
    });
  };

  return (
    <div className="budget-splitter">
      <div className="budget-header">
        <div className="budget-title">
          <PieChart className="budget-icon" />
          <h3>Budget Breakdown</h3>
        </div>
        <div className="budget-summary">
          <div className="total-budget">
            <span className="budget-label">Total Budget</span>
            <span className="budget-amount">${totalBudget.toLocaleString()}</span>
          </div>
          <div className={`remaining-budget ${remaining < 0 ? 'over-budget' : ''}`}>
            <span className="budget-label">
              {remaining >= 0 ? 'Remaining' : 'Over Budget'}
            </span>
            <span className="budget-amount">
              ${Math.abs(remaining).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="budget-categories">
        {categories.map((category) => {
          const Icon = category.icon;
          const amount = breakdown[category.key];
          const percentage = getPercentage(amount);

          return (
            <div key={category.key} className="budget-category">
              <div className="category-header">
                <div className="category-info">
                  <div 
                    className="category-icon"
                    style={{ backgroundColor: category.color }}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="category-details">
                    <span className="category-label">{category.label}</span>
                    <span className="category-percentage">{percentage}%</span>
                  </div>
                </div>
                <div className="category-amount">
                  <DollarSign size={16} />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => handleBudgetChange(category.key, parseInt(e.target.value) || 0)}
                    className="amount-input"
                    min="0"
                    max={totalBudget}
                  />
                </div>
              </div>
              <div className="category-bar">
                <div 
                  className="category-progress"
                  style={{ 
                    width: `${Math.min(parseFloat(percentage), 100)}%`,
                    backgroundColor: category.color
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="budget-actions">
        <button onClick={resetToDefaults} className="reset-button">
          Reset to Recommended
        </button>
        {remaining < 0 && (
          <div className="budget-warning">
            ⚠️ You've exceeded your budget by ${Math.abs(remaining).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetSplitter;
