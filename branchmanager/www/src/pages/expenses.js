/**
 * Branch Manager — Expense Tracking
 * Track business costs, receipts, and monthly P&L
 */
var ExpensesPage = {
  render: function() {
    var expenses = DB.expenses ? DB.expenses.getAll() : [];
    var now = new Date();
    var thisMonth = expenses.filter(function(e) {
      return new Date(e.date).getMonth() === now.getMonth() && new Date(e.date).getFullYear() === now.getFullYear();
    });
    var totalThisMonth = thisMonth.reduce(function(s, e) { return s + (e.amount || 0); }, 0);

    // Categories
    var categories = [
      { key: 'fuel', label: 'Fuel', icon: '⛽' },
      { key: 'equipment', label: 'Equipment', icon: '🔧' },
      { key: 'insurance', label: 'Insurance', icon: '🛡️' },
      { key: 'vehicle', label: 'Vehicle', icon: '🚛' },
      { key: 'supplies', label: 'Supplies', icon: '🪚' },
      { key: 'labor', label: 'Labor/Payroll', icon: '👷' },
      { key: 'office', label: 'Office/Admin', icon: '📎' },
      { key: 'marketing', label: 'Marketing', icon: '📣' },
      { key: 'other', label: 'Other', icon: '📋' }
    ];

    var html = '<div class="stat-grid">'
      + UI.statCard('This Month', UI.moneyInt(totalThisMonth), thisMonth.length + ' expenses', '', '', '')
      + UI.statCard('Fixed Monthly', UI.moneyInt(ExpensesPage._getFixedCosts()), 'Truck, insurance, etc.', '', '', '')
      + UI.statCard('Avg per Job', expenses.length ? UI.moneyInt(totalThisMonth / Math.max(1, DB.jobs.getAll().filter(function(j) { return j.status === 'completed' && new Date(j.completedDate).getMonth() === now.getMonth(); }).length)) : '$0', 'Variable costs / jobs done', '', '', '')
      + '</div>';

    // Add expense form
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<h3 style="font-size:15px;margin-bottom:12px;">Add Expense</h3>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;align-items:end;">'
      + '<div><label style="font-size:12px;color:var(--text-light);display:block;margin-bottom:4px;">Amount</label>'
      + '<input type="number" id="exp-amount" placeholder="0.00" step="0.01" style="width:100%;padding:10px;border:2px solid var(--border);border-radius:8px;font-size:15px;font-weight:700;"></div>'
      + '<div><label style="font-size:12px;color:var(--text-light);display:block;margin-bottom:4px;">Category</label>'
      + '<select id="exp-category" style="width:100%;padding:10px;border:2px solid var(--border);border-radius:8px;font-size:14px;">';
    categories.forEach(function(c) { html += '<option value="' + c.key + '">' + c.icon + ' ' + c.label + '</option>'; });
    html += '</select></div>'
      + '<div><label style="font-size:12px;color:var(--text-light);display:block;margin-bottom:4px;">Description</label>'
      + '<input type="text" id="exp-desc" placeholder="What was it for?" style="width:100%;padding:10px;border:2px solid var(--border);border-radius:8px;font-size:14px;"></div>'
      + '<button onclick="ExpensesPage.addExpense()" style="background:var(--green-dark);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:700;cursor:pointer;white-space:nowrap;">+ Add</button>'
      + '</div></div>';

    // Fixed costs setup
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="var el=document.getElementById(\'fixed-costs\');el.style.display=el.style.display===\'none\'?\'block\':\'none\';">'
      + '<h3 style="font-size:15px;">Fixed Monthly Costs</h3><span style="color:var(--text-light);">▶</span></div>'
      + '<div id="fixed-costs" style="display:none;margin-top:12px;">'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">';
    var fixedDefaults = [
      { key: 'truck_payment', label: 'Truck Payment', default: 1912 },
      { key: 'pickup_payment', label: 'Pickup Payment', default: 1000 },
      { key: 'insurance_monthly', label: 'Insurance', default: 1300 },
      { key: 'repair_fund', label: 'Repair Fund', default: 1000 },
      { key: 'phone', label: 'Phone/Dialpad', default: 75 },
      { key: 'software', label: 'Software', default: 50 },
      { key: 'storage', label: 'Storage/Yard', default: 0 },
      { key: 'loan', label: 'Loan Payment', default: 0 },
      { key: 'other_fixed', label: 'Other Fixed', default: 0 }
    ];
    fixedDefaults.forEach(function(f) {
      var saved = localStorage.getItem('bm-fixed-' + f.key);
      var val = saved !== null ? saved : f.default;
      html += '<div><label style="font-size:11px;color:var(--text-light);display:block;margin-bottom:3px;">' + f.label + '</label>'
        + '<input type="number" id="fixed-' + f.key + '" value="' + val + '" onchange="ExpensesPage.saveFixed(\'' + f.key + '\', this.value)" style="width:100%;padding:8px;border:2px solid var(--border);border-radius:6px;font-size:14px;font-weight:600;"></div>';
    });
    html += '</div></div></div>';

    // Expense list
    html += '<div style="background:var(--white);border-radius:12px;padding:20px;border:1px solid var(--border);">'
      + '<h3 style="font-size:15px;margin-bottom:12px;">Recent Expenses</h3>';
    if (thisMonth.length) {
      // Group by category
      var grouped = {};
      thisMonth.forEach(function(e) {
        if (!grouped[e.category]) grouped[e.category] = [];
        grouped[e.category].push(e);
      });
      Object.keys(grouped).forEach(function(cat) {
        var catInfo = categories.find(function(c) { return c.key === cat; }) || { icon: '📋', label: cat };
        var catTotal = grouped[cat].reduce(function(s, e) { return s + e.amount; }, 0);
        html += '<div style="margin-bottom:12px;">'
          + '<div style="display:flex;justify-content:space-between;padding:6px 0;font-weight:600;border-bottom:1px solid var(--border);">'
          + '<span>' + catInfo.icon + ' ' + catInfo.label + '</span><span>' + UI.money(catTotal) + '</span></div>';
        grouped[cat].forEach(function(e) {
          html += '<div style="display:flex;justify-content:space-between;padding:6px 0 6px 24px;font-size:13px;border-bottom:1px solid #f5f5f5;">'
            + '<span style="color:var(--text-light);">' + (e.description || cat) + ' <span style="font-size:11px;">' + UI.dateShort(e.date) + '</span></span>'
            + '<span style="font-weight:600;">' + UI.money(e.amount) + '</span></div>';
        });
        html += '</div>';
      });
    } else {
      html += '<div style="text-align:center;padding:20px;color:var(--text-light);font-size:14px;">No expenses this month. Add your first one above.</div>';
    }
    html += '</div>';

    return html;
  },

  addExpense: function() {
    var amount = parseFloat(document.getElementById('exp-amount').value);
    var category = document.getElementById('exp-category').value;
    var desc = document.getElementById('exp-desc').value;
    if (!amount || amount <= 0) { UI.toast('Enter an amount', 'error'); return; }

    if (!DB.expenses) {
      // Bootstrap expenses in DB
      DB.expenses = {
        getAll: function() { try { return JSON.parse(localStorage.getItem('bm-expenses')) || []; } catch(e) { return []; } },
        create: function(r) {
          var all = DB.expenses.getAll();
          r.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
          r.date = r.date || new Date().toISOString();
          all.unshift(r);
          localStorage.setItem('bm-expenses', JSON.stringify(all));
          return r;
        }
      };
    }

    DB.expenses.create({ amount: amount, category: category, description: desc });
    document.getElementById('exp-amount').value = '';
    document.getElementById('exp-desc').value = '';
    UI.toast('Expense added: ' + UI.money(amount));
    loadPage('expenses');
  },

  saveFixed: function(key, value) {
    localStorage.setItem('bm-fixed-' + key, value);
  },

  _getFixedCosts: function() {
    var keys = ['truck_payment', 'pickup_payment', 'insurance_monthly', 'repair_fund', 'phone', 'software', 'storage', 'loan', 'other_fixed'];
    var defaults = { truck_payment: 1912, pickup_payment: 1000, insurance_monthly: 1300, repair_fund: 1000, phone: 75, software: 50, storage: 0, loan: 0, other_fixed: 0 };
    return keys.reduce(function(total, key) {
      var val = localStorage.getItem('bm-fixed-' + key);
      return total + parseFloat(val !== null ? val : defaults[key]);
    }, 0);
  }
};

// Bootstrap DB.expenses if not exists
if (!DB.expenses) {
  DB.expenses = {
    getAll: function() { try { return JSON.parse(localStorage.getItem('bm-expenses')) || []; } catch(e) { return []; } },
    create: function(r) {
      var all = DB.expenses.getAll();
      r.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      r.date = r.date || new Date().toISOString();
      all.unshift(r);
      localStorage.setItem('bm-expenses', JSON.stringify(all));
      return r;
    }
  };
}
