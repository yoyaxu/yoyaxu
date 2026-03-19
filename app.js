const STORAGE_KEY = 'expense-tracker-items';

const expenseForm = document.getElementById('expenseForm');
const expenseList = document.getElementById('expenseList');
const totalAmount = document.getElementById('totalAmount');
const monthCount = document.getElementById('monthCount');
const topCategory = document.getElementById('topCategory');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const clearDataButton = document.getElementById('clearDataButton');
const exportButton = document.getElementById('exportButton');
const itemTemplate = document.getElementById('expenseItemTemplate');
const dateInput = document.getElementById('date');

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'USD',
});

const today = new Date();
dateInput.value = today.toISOString().split('T')[0];

let expenses = loadExpenses();

function loadExpenses() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function formatDisplayDate(dateString) {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
  }).format(new Date(`${dateString}T00:00:00`));
}

function getFilteredExpenses() {
  const search = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  return expenses.filter((expense) => {
    const matchesSearch = expense.description.toLowerCase().includes(search);
    const matchesCategory = category === 'all' || expense.category === category;
    return matchesSearch && matchesCategory;
  });
}

function renderSummary() {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  totalAmount.textContent = currencyFormatter.format(total);

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const monthlyExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(`${expense.date}T00:00:00`);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });

  monthCount.textContent = String(monthlyExpenses.length);

  const totalsByCategory = expenses.reduce((accumulator, expense) => {
    accumulator[expense.category] = (accumulator[expense.category] || 0) + expense.amount;
    return accumulator;
  }, {});

  const [categoryName] = Object.entries(totalsByCategory).sort((a, b) => b[1] - a[1])[0] || [];
  topCategory.textContent = categoryName || 'Sin datos';
}

function renderExpenses() {
  const filteredExpenses = getFilteredExpenses().sort((a, b) => new Date(b.date) - new Date(a.date));
  expenseList.innerHTML = '';

  if (filteredExpenses.length === 0) {
    expenseList.className = 'expense-list empty-state';
    expenseList.textContent = 'No hay movimientos que coincidan con los filtros actuales.';
    renderSummary();
    return;
  }

  expenseList.className = 'expense-list';

  filteredExpenses.forEach((expense) => {
    const fragment = itemTemplate.content.cloneNode(true);
    fragment.querySelector('.expense-title').textContent = expense.description;
    fragment.querySelector('.expense-meta').textContent = `${expense.category} · ${formatDisplayDate(expense.date)} · ${expense.paymentMethod}`;
    fragment.querySelector('.expense-notes').textContent = expense.notes || 'Sin notas adicionales.';
    fragment.querySelector('.expense-amount').textContent = currencyFormatter.format(expense.amount);

    fragment.querySelector('.delete-button').addEventListener('click', () => {
      expenses = expenses.filter((item) => item.id !== expense.id);
      saveExpenses();
      renderExpenses();
    });

    expenseList.appendChild(fragment);
  });

  renderSummary();
}

function resetForm() {
  expenseForm.reset();
  dateInput.value = today.toISOString().split('T')[0];
}

expenseForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(expenseForm);
  const newExpense = {
    id: crypto.randomUUID(),
    description: String(formData.get('description')).trim(),
    amount: Number(formData.get('amount')),
    category: String(formData.get('category')),
    date: String(formData.get('date')),
    paymentMethod: String(formData.get('paymentMethod')),
    notes: String(formData.get('notes')).trim(),
  };

  expenses.unshift(newExpense);
  saveExpenses();
  resetForm();
  renderExpenses();
});

searchInput.addEventListener('input', renderExpenses);
categoryFilter.addEventListener('change', renderExpenses);

clearDataButton.addEventListener('click', () => {
  if (expenses.length === 0) return;

  const confirmed = window.confirm('¿Quieres borrar todos los movimientos registrados?');
  if (!confirmed) return;

  expenses = [];
  saveExpenses();
  renderExpenses();
});

exportButton.addEventListener('click', () => {
  if (expenses.length === 0) {
    window.alert('No hay movimientos para exportar.');
    return;
  }

  const rows = [
    ['Descripción', 'Monto', 'Categoría', 'Fecha', 'Método de pago', 'Notas'],
    ...expenses.map((expense) => [
      expense.description,
      expense.amount.toFixed(2),
      expense.category,
      expense.date,
      expense.paymentMethod,
      expense.notes.replaceAll('\n', ' '),
    ]),
  ];

  const csvContent = rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gastos.csv';
  link.click();
  URL.revokeObjectURL(url);
});

renderExpenses();
