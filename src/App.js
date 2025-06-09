import React, { useState, useEffect } from 'react';
import { Chart } from 'chart.js/auto';
import './styles.css';

const BudgetApp = () => {
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [bills, setBills] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [monthlyPayments, setMonthlyPayments] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCreditCard, setNewCreditCard] = useState({ name: '', balance: '', limit: '' });
  const [editingCard, setEditingCard] = useState(null);
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [savedBudgets, setSavedBudgets] = useState([]);
  const [currentBudgetName, setCurrentBudgetName] = useState('Default Budget');

  useEffect(() => {
    // Load data from localStorage
    const savedData = localStorage.getItem('budgetData');
    const storedBudgets = localStorage.getItem('savedBudgets');
    if (storedBudgets) {
      setSavedBudgets(JSON.parse(storedBudgets));
    }
    const lastLoadedBudget = localStorage.getItem('lastLoadedBudget');

    if (lastLoadedBudget) {
      setCurrentBudgetName(lastLoadedBudget);
      loadBudget(lastLoadedBudget, false); // Load the last active budget without re-setting lastLoadedBudget
    } else if (savedData) {
      const data = JSON.parse(savedData);
      setIncome(data.income || 0);
      setExpenses(data.expenses || []);
      setBills(data.bills || []);
      setCreditCards(data.creditCards || []);
      setMonthlyPayments(data.monthlyPayments || {});
      setDarkMode(data.darkMode || false);
    }
  }, []);

  useEffect(() => {
    if (autosaveEnabled) {
      const data = {
        income,
        expenses,
        bills,
        creditCards,
        monthlyPayments,
        darkMode
      };
      localStorage.setItem(`budget_${currentBudgetName}`, JSON.stringify(data));
      localStorage.setItem('lastLoadedBudget', currentBudgetName);
      setLastSaved(new Date().toLocaleTimeString());
    }
  }, [income, expenses, bills, creditCards, monthlyPayments, darkMode, autosaveEnabled, currentBudgetName]);

  useEffect(() => {
    localStorage.setItem('savedBudgets', JSON.stringify(savedBudgets));
  }, [savedBudgets]);

  const addExpense = (expense) => {
    setExpenses([...expenses, { ...expense, id: Date.now() }]);
  };

  const addBill = (bill) => {
    setBills([...bills, { ...bill, id: Date.now() }]);
  };

  const addCreditCard = () => {
    if (newCreditCard.name && newCreditCard.balance && newCreditCard.limit) {
      const card = {
        ...newCreditCard,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        balance: parseFloat(newCreditCard.balance),
        limit: parseFloat(newCreditCard.limit)
      };
      setCreditCards([...creditCards, card]);
      setNewCreditCard({ name: '', balance: '', limit: '' });
      setShowAddCardModal(false);
    }
  };

  const updateMonthlyPayment = (cardId, payment) => {
    setMonthlyPayments(prevPayments => {
      const newPayments = { ...prevPayments };
      if (payment === '') {
        newPayments[cardId] = '';
      } else {
        const parsedPayment = parseFloat(payment);
        if (!isNaN(parsedPayment)) {
          newPayments[cardId] = parsedPayment;
        }
      }
      return newPayments;
    });
  };

  const editCreditCard = (card) => {
    setEditingCard({ ...card });
  };

  const saveEdit = () => {
    if (editingCard) {
      setCreditCards(creditCards.map(card =>
        card.id === editingCard.id ? editingCard : card
      ));
      setEditingCard(null);
    }
  };

  const cancelEdit = () => {
    setEditingCard(null);
  };

  const deleteCreditCard = (cardId) => {
    setCreditCards(creditCards.filter(card => card.id !== cardId));
    const newPayments = { ...monthlyPayments };
    delete newPayments[cardId];
    setMonthlyPayments(newPayments);
  };

  const saveBudget = (name) => {
    if (!name) {
      alert('Please enter a name for your budget.');
      return;
    }
    const data = {
      income,
      expenses,
      bills,
      creditCards,
      monthlyPayments,
      darkMode
    };
    localStorage.setItem(`budget_${name}`, JSON.stringify(data));
    if (!savedBudgets.includes(name)) {
      setSavedBudgets([...savedBudgets, name]);
    }
    setCurrentBudgetName(name);
    alert(`Budget '${name}' saved!`);
  };

  const loadBudget = (name, setAsLastLoaded = true) => {
    const savedData = localStorage.getItem(`budget_${name}`);
    if (savedData) {
      const data = JSON.parse(savedData);
      setIncome(data.income || 0);
      setExpenses(data.expenses || []);
      setBills(data.bills || []);
      setCreditCards(data.creditCards || []);
      setMonthlyPayments(data.monthlyPayments || {});
      setDarkMode(data.darkMode || false);
      setCurrentBudgetName(name);
      if (setAsLastLoaded) {
        localStorage.setItem('lastLoadedBudget', name);
      }
      alert(`Budget '${name}' loaded!`);
    } else {
      alert(`Budget '${name}' not found.`);
    }
  };

  const deleteBudget = (name) => {
    if (window.confirm(`Are you sure you want to delete budget '${name}'?`)) {
      localStorage.removeItem(`budget_${name}`);
      setSavedBudgets(savedBudgets.filter(b => b !== name));
      if (currentBudgetName === name) {
        setCurrentBudgetName('Default Budget'); // Switch to default if current is deleted
        setIncome(0);
        setExpenses([]);
        setBills([]);
        setCreditCards([]);
        setMonthlyPayments({});
      }
      alert(`Budget '${name}' deleted.`);
    }
  };

  const shareBudget = () => {
    const data = {
      income,
      expenses,
      bills,
      creditCards,
      monthlyPayments
    };
    const encodedData = btoa(JSON.stringify(data));
    const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Budget link copied to clipboard!');
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const totalCreditCardPayments = Object.values(monthlyPayments).reduce((sum, payment) => sum + payment, 0);
  const remainingIncome = income - totalExpenses - totalBills - totalCreditCardPayments;

  return (
    <div className={`min-h-screen ${darkMode ? 'dark-mode' : ''}`}>
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Budget Manager</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="btn btn-secondary"
            >
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              onClick={shareBudget}
              className="btn btn-secondary"
            >
              Share Budget
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-4">
            <h2 className="text-xl font-bold mb-4">Monthly Income</h2>
            <label htmlFor="monthly-income" className="sr-only">Monthly Income</label>
            <input
              id="monthly-income"
              name="monthlyIncome"
              type="number"
              value={income}
              onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
              className="input-field w-full"
              placeholder="Enter monthly income"
            />
          </div>

          <div className="card p-4">
            <h2 className="text-xl font-bold mb-4">Monthly Summary</h2>
            <div className="space-y-2">
              <p>Total Expenses: ${totalExpenses.toFixed(2)}</p>
              <p>Total Bills: ${totalBills.toFixed(2)}</p>
              <p>Total Credit Card Payments: ${totalCreditCardPayments.toFixed(2)}</p>
              <p className="font-bold">Remaining Income: ${remainingIncome.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Credit Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditCards.map((card, index) => {
              console.log(`Rendering card: ${card.name}, ID: ${card.id}, Payment: ${monthlyPayments[card.id]}`);
              return (
                <div key={`card-${card.id}-${index}`} className="card p-4">
                  <h3 className="font-bold">{card.name}</h3>
                  <p>Balance: ${card.balance.toFixed(2)}</p>
                  <p>Limit: ${card.limit.toFixed(2)}</p>
                  <div className="mt-2">
                    <label htmlFor={`monthly-payment-${card.id}`} className="block text-sm">Monthly Payment:</label>
                    <input
                      id={`monthly-payment-${card.id}`}
                      name={`monthlyPayment-${card.id}`}
                      key={`payment-${card.id}-${index}`}
                      type="number"
                      value={monthlyPayments[card.id] ?? ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateMonthlyPayment(card.id, value);
                      }}
                      className="input-field w-full"
                      placeholder="Enter monthly payment"
                    />
                  </div>
                  <div className="mt-2">
                    <button
                      onClick={() => deleteCreditCard(card.id)}
                      className="btn btn-secondary"
                    >
                      Delete Card
                    </button>
                    <button
                      onClick={() => editCreditCard(card)}
                      className="btn btn-primary ml-2 mt-2"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setShowAddCardModal(true)}
            className="btn mt-4"
          >
            Add Credit Card
          </button>
        </div>

        {showAddCardModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg w-96">
              <h3 className="text-xl font-bold mb-4">Add Credit Card</h3>
              <label htmlFor="new-card-name" className="block text-sm sr-only">Card Name</label>
              <input
                id="new-card-name"
                name="newCardName"
                type="text"
                value={newCreditCard.name}
                onChange={(e) => setNewCreditCard({ ...newCreditCard, name: e.target.value })}
                className="input-field w-full mb-2"
                placeholder="Card Name"
              />
              <label htmlFor="new-card-balance" className="block text-sm sr-only">Current Balance</label>
              <input
                id="new-card-balance"
                name="newCardBalance"
                type="number"
                value={newCreditCard.balance}
                onChange={(e) => setNewCreditCard({ ...newCreditCard, balance: e.target.value })}
                className="input-field w-full mb-2"
                placeholder="Current Balance"
              />
              <label htmlFor="new-card-limit" className="block text-sm sr-only">Credit Limit</label>
              <input
                id="new-card-limit"
                name="newCardLimit"
                type="number"
                value={newCreditCard.limit}
                onChange={(e) => setNewCreditCard({ ...newCreditCard, limit: e.target.value })}
                className="input-field w-full mb-4"
                placeholder="Credit Limit"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowAddCardModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={addCreditCard}
                  className="btn"
                >
                  Add Card
                </button>
              </div>
            </div>
          </div>
        )}

        {editingCard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg w-96">
              <h3 className="text-xl font-bold mb-4">Edit Credit Card</h3>
              <label htmlFor="edit-card-name" className="block text-sm sr-only">Card Name</label>
              <input
                id="edit-card-name"
                name="editCardName"
                type="text"
                value={editingCard.name}
                onChange={(e) => setEditingCard({ ...editingCard, name: e.target.value })}
                className="input-field w-full mb-2"
                placeholder="Card Name"
              />
              <label htmlFor="edit-card-balance" className="block text-sm sr-only">Current Balance</label>
              <input
                id="edit-card-balance"
                name="editCardBalance"
                type="number"
                value={editingCard.balance}
                onChange={(e) => setEditingCard({ ...editingCard, balance: parseFloat(e.target.value) || 0 })}
                className="input-field w-full mb-2"
                placeholder="Current Balance"
              />
              <label htmlFor="edit-card-limit" className="block text-sm sr-only">Credit Limit</label>
              <input
                id="edit-card-limit"
                name="editCardLimit"
                type="number"
                value={editingCard.limit}
                onChange={(e) => setEditingCard({ ...editingCard, limit: parseFloat(e.target.value) || 0 })}
                className="input-field w-full mb-4"
                placeholder="Credit Limit"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={cancelEdit}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="btn"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <div className="flex items-center space-x-4 mb-4">
            <label htmlFor="autosave-toggle" className="flex items-center">
              <input
                id="autosave-toggle"
                type="checkbox"
                checked={autosaveEnabled}
                onChange={(e) => setAutosaveEnabled(e.target.checked)}
                className="form-checkbox"
              />
              <span className="ml-2">Enable Autosave</span>
            </label>
            {lastSaved && (
              <span className="text-sm text-gray-600">
                Last saved: {lastSaved}
              </span>
            )}
          </div>

          <div className="card p-4 mt-4">
            <h2 className="text-xl font-bold mb-4">Manage Budgets</h2>
            <p className="text-gray-700 mb-2">Current Budget: <span className="font-semibold text-primary-orange">{currentBudgetName}</span></p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
              <input
                type="text"
                id="new-budget-name"
                placeholder="Enter new budget name"
                className="input-field flex-grow"
              />
              <button
                onClick={() => saveBudget(document.getElementById('new-budget-name').value)}
                className="btn btn-primary"
              >
                Save Current Budget
              </button>
            </div>

            {savedBudgets.length > 0 && (
              <div className="mt-4">
                <label htmlFor="load-budget-select" className="block text-sm font-medium text-gray-700">Load Saved Budget:</label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-1">
                  <select
                    id="load-budget-select"
                    className="input-field flex-grow"
                    defaultValue=""
                  >
                    <option value="" disabled>Select a budget</option>
                    {savedBudgets.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => loadBudget(document.getElementById('load-budget-select').value)}
                    className="btn btn-secondary"
                  >
                    Load Budget
                  </button>
                  <button
                    onClick={() => deleteBudget(document.getElementById('load-budget-select').value)}
                    className="btn bg-red-600 hover:bg-red-700"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BudgetApp; 