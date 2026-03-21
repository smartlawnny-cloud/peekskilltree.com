/**
 * Branch Manager — Pipeline (Kanban Board)
 * Visual drag-and-drop board tracking leads through stages
 * Like Jobber's Pipeline feature
 */
var PipelinePage = {
  stages: [
    { id: 'new_lead', label: 'New Lead', color: '#2196f3', icon: '📥' },
    { id: 'assessment', label: 'Assessment', color: '#9c27b0', icon: '🔍' },
    { id: 'quote_sent', label: 'Quote Sent', color: '#ff9800', icon: '📋' },
    { id: 'follow_up', label: 'Follow Up', color: '#e91e63', icon: '📞' },
    { id: 'won', label: 'Won', color: '#4caf50', icon: '✅' },
    { id: 'lost', label: 'Lost', color: '#9e9e9e', icon: '❌' }
  ],

  render: function() {
    var deals = PipelinePage.getDeals();
    var stageStats = {};
    PipelinePage.stages.forEach(function(s) { stageStats[s.id] = { count: 0, value: 0 }; });
    deals.forEach(function(d) {
      if (stageStats[d.stage]) {
        stageStats[d.stage].count++;
        stageStats[d.stage].value += d.value || 0;
      }
    });

    var totalValue = deals.reduce(function(s, d) { return s + (d.value || 0); }, 0);
    var wonValue = deals.filter(function(d) { return d.stage === 'won'; }).reduce(function(s, d) { return s + (d.value || 0); }, 0);
    var winRate = deals.length > 0 ? Math.round((stageStats.won.count / deals.length) * 100) : 0;

    // Stats
    var html = '<div class="stat-grid">'
      + UI.statCard('Pipeline Value', UI.moneyInt(totalValue), deals.length + ' deals', '', '')
      + UI.statCard('Won', UI.moneyInt(wonValue), stageStats.won.count + ' deals', 'up', '')
      + UI.statCard('Win Rate', winRate + '%', '', winRate >= 50 ? 'up' : 'down', '')
      + '</div>';

    // Kanban board
    html += '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:16px;">'
      + '<div style="display:flex;gap:12px;min-width:' + (PipelinePage.stages.length * 240) + 'px;">';

    PipelinePage.stages.forEach(function(stage) {
      var stageDeals = deals.filter(function(d) { return d.stage === stage.id; });

      html += '<div class="pipeline-column" data-stage="' + stage.id + '" style="flex:1;min-width:220px;background:var(--bg);border-radius:12px;padding:12px;"'
        + ' ondragover="event.preventDefault();this.style.background=\'#e8f5e9\'" ondragleave="this.style.background=\'var(--bg)\'" ondrop="PipelinePage.drop(event, \'' + stage.id + '\')">';

      // Column header
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:8px;border-bottom:3px solid ' + stage.color + ';">'
        + '<div style="font-weight:700;font-size:13px;">' + stage.icon + ' ' + stage.label + '</div>'
        + '<div style="display:flex;align-items:center;gap:6px;">'
        + '<span style="background:' + stage.color + ';color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;">' + stageStats[stage.id].count + '</span>'
        + '<span style="font-size:11px;color:var(--text-light);">' + UI.moneyInt(stageStats[stage.id].value) + '</span>'
        + '</div></div>';

      // Deal cards
      if (stageDeals.length === 0) {
        html += '<div style="text-align:center;padding:20px;font-size:12px;color:#ccc;border:2px dashed #e0e0e0;border-radius:8px;">Drop here</div>';
      } else {
        stageDeals.forEach(function(deal) {
          html += '<div class="pipeline-card" draggable="true" ondragstart="PipelinePage.dragStart(event, \'' + deal.id + '\')" onclick="PipelinePage.showDeal(\'' + deal.id + '\')"'
            + ' style="background:var(--white);border-radius:8px;padding:12px;margin-bottom:8px;border:1px solid var(--border);cursor:grab;box-shadow:0 1px 3px rgba(0,0,0,.06);transition:box-shadow .15s;"'
            + ' onmouseover="this.style.boxShadow=\'0 4px 12px rgba(0,0,0,.12)\'" onmouseout="this.style.boxShadow=\'0 1px 3px rgba(0,0,0,.06)\'">'
            + '<div style="font-weight:700;font-size:14px;margin-bottom:4px;">' + (deal.clientName || 'Unknown') + '</div>'
            + '<div style="font-size:12px;color:var(--text-light);margin-bottom:6px;">' + (deal.description || '') + '</div>'
            + '<div style="display:flex;justify-content:space-between;align-items:center;">'
            + '<span style="font-size:1rem;font-weight:800;color:var(--green-dark);">' + UI.moneyInt(deal.value) + '</span>'
            + '<span style="font-size:11px;color:var(--text-light);">' + UI.dateRelative(deal.createdAt) + '</span>'
            + '</div>'
            + (deal.source ? '<div style="font-size:10px;color:var(--text-light);margin-top:4px;">via ' + deal.source + '</div>' : '')
            + '</div>';
        });
      }

      // Add deal button
      if (stage.id !== 'won' && stage.id !== 'lost') {
        html += '<button style="width:100%;padding:8px;background:none;border:2px dashed var(--border);border-radius:8px;color:var(--text-light);font-size:12px;cursor:pointer;margin-top:4px;" '
          + 'onclick="PipelinePage.addDeal(\'' + stage.id + '\')">+ Add</button>';
      }

      html += '</div>';
    });

    html += '</div></div>';

    return html;
  },

  // Data management
  getDeals: function() {
    var stored = localStorage.getItem('bm-pipeline');
    if (stored) return JSON.parse(stored);

    // Seed from existing requests/quotes
    var deals = [];
    DB.requests.getAll().forEach(function(r) {
      if (r.status === 'new') {
        deals.push({ id: r.id, clientName: r.clientName, clientId: r.clientId, description: r.property || '', value: 0, stage: 'new_lead', source: r.source, createdAt: r.createdAt });
      }
    });
    DB.quotes.getAll().forEach(function(q) {
      var stage = q.status === 'approved' || q.status === 'converted' ? 'won' : q.status === 'declined' ? 'lost' : q.status === 'sent' || q.status === 'awaiting' ? 'quote_sent' : 'assessment';
      deals.push({ id: q.id, clientName: q.clientName, clientId: q.clientId, description: q.description || '', value: q.total || 0, stage: stage, quoteId: q.id, createdAt: q.createdAt });
    });
    PipelinePage.saveDeals(deals);
    return deals;
  },

  saveDeals: function(deals) {
    localStorage.setItem('bm-pipeline', JSON.stringify(deals));
  },

  // Drag and drop
  _dragId: null,

  dragStart: function(e, dealId) {
    PipelinePage._dragId = dealId;
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
    setTimeout(function() { e.target.style.opacity = '1'; }, 0);
  },

  drop: function(e, newStage) {
    e.preventDefault();
    e.currentTarget.style.background = 'var(--bg)';
    if (!PipelinePage._dragId) return;

    var deals = PipelinePage.getDeals();
    var deal = deals.find(function(d) { return d.id === PipelinePage._dragId; });
    if (deal) {
      var oldStage = deal.stage;
      deal.stage = newStage;
      deal.movedAt = new Date().toISOString();
      PipelinePage.saveDeals(deals);

      // Update linked records
      if (newStage === 'won' && deal.quoteId) {
        DB.quotes.update(deal.quoteId, { status: 'approved' });
      } else if (newStage === 'lost' && deal.quoteId) {
        DB.quotes.update(deal.quoteId, { status: 'declined' });
      }

      UI.toast('Moved to ' + PipelinePage.stages.find(function(s) { return s.id === newStage; }).label);
      loadPage('pipeline');
    }
    PipelinePage._dragId = null;
  },

  addDeal: function(stage) {
    var clientOptions = DB.clients.getAll().map(function(c) { return { value: c.id, label: c.name }; });

    var html = '<form id="deal-form" onsubmit="PipelinePage.saveDeal(event, \'' + stage + '\')">'
      + UI.formField('Client', 'select', 'd-client', '', { options: [{ value: '', label: 'Select or type new...' }].concat(clientOptions) })
      + UI.formField('Or New Client Name', 'text', 'd-newclient', '', { placeholder: 'New client name' })
      + UI.formField('Description', 'text', 'd-desc', '', { placeholder: 'e.g., 3 oak removals, backyard' })
      + UI.formField('Estimated Value ($)', 'number', 'd-value', '', { placeholder: '2500' })
      + UI.formField('Source', 'select', 'd-source', '', { options: ['', 'Google Search', 'Facebook', 'Instagram', 'Nextdoor', 'Friend/Referral', 'Yelp', 'Angi', 'Drive-by', 'Repeat Client', 'Other'] })
      + '</form>';

    UI.showModal('Add Deal', html, {
      footer: '<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>'
        + ' <button class="btn btn-primary" onclick="document.getElementById(\'deal-form\').requestSubmit()">Add Deal</button>'
    });
  },

  saveDeal: function(e, stage) {
    e.preventDefault();
    var clientId = document.getElementById('d-client').value;
    var newName = document.getElementById('d-newclient').value.trim();
    var clientName = '';

    if (clientId) {
      var client = DB.clients.getById(clientId);
      clientName = client ? client.name : '';
    } else if (newName) {
      var newClient = DB.clients.create({ name: newName, status: 'lead' });
      clientId = newClient.id;
      clientName = newName;
    } else {
      UI.toast('Select or enter a client', 'error');
      return;
    }

    var deals = PipelinePage.getDeals();
    deals.push({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      clientId: clientId,
      clientName: clientName,
      description: document.getElementById('d-desc').value.trim(),
      value: parseFloat(document.getElementById('d-value').value) || 0,
      source: document.getElementById('d-source').value,
      stage: stage,
      createdAt: new Date().toISOString()
    });
    PipelinePage.saveDeals(deals);

    UI.toast('Deal added to pipeline');
    UI.closeModal();
    loadPage('pipeline');
  },

  showDeal: function(dealId) {
    var deals = PipelinePage.getDeals();
    var deal = deals.find(function(d) { return d.id === dealId; });
    if (!deal) return;

    var stage = PipelinePage.stages.find(function(s) { return s.id === deal.stage; });

    var html = '<div style="margin-bottom:16px;">'
      + '<h2 style="margin-bottom:4px;">' + deal.clientName + '</h2>'
      + '<div style="color:var(--text-light);">' + (deal.description || '') + '</div>'
      + '<div style="margin-top:8px;display:flex;gap:8px;align-items:center;">'
      + '<span style="background:' + stage.color + ';color:#fff;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:700;">' + stage.icon + ' ' + stage.label + '</span>'
      + '<span style="font-size:1.5rem;font-weight:800;color:var(--green-dark);">' + UI.moneyInt(deal.value) + '</span>'
      + '</div>'
      + (deal.source ? '<div style="font-size:13px;color:var(--text-light);margin-top:8px;">Source: ' + deal.source + '</div>' : '')
      + '<div style="font-size:13px;color:var(--text-light);">Created: ' + UI.dateRelative(deal.createdAt) + '</div>'
      + '</div>';

    // Move to stage buttons
    html += '<div style="font-weight:700;font-size:13px;margin-bottom:8px;">Move to:</div>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;">';
    PipelinePage.stages.forEach(function(s) {
      html += '<button class="btn ' + (deal.stage === s.id ? 'btn-primary' : 'btn-outline') + '" style="font-size:12px;" onclick="PipelinePage.moveDeal(\'' + dealId + '\',\'' + s.id + '\')">' + s.icon + ' ' + s.label + '</button>';
    });
    html += '</div>';

    // Value edit
    html += '<div style="margin-top:16px;">'
      + UI.formField('Deal Value ($)', 'number', 'deal-value', deal.value, { placeholder: '0' })
      + '<button class="btn btn-outline" style="font-size:12px;" onclick="PipelinePage.updateValue(\'' + dealId + '\')">Update Value</button>'
      + '</div>';

    UI.showModal(deal.clientName, html, {
      footer: '<button class="btn" style="background:var(--red);color:#fff;margin-right:auto;" onclick="PipelinePage.removeDeal(\'' + dealId + '\')">Delete</button>'
        + '<button class="btn btn-outline" onclick="UI.closeModal()">Close</button>'
        + (deal.stage !== 'won' ? ' <button class="btn btn-primary" onclick="UI.closeModal();QuotesPage.showForm(null, \'' + deal.clientId + '\')">Create Quote</button>' : '')
    });
  },

  moveDeal: function(dealId, newStage) {
    var deals = PipelinePage.getDeals();
    var deal = deals.find(function(d) { return d.id === dealId; });
    if (deal) {
      deal.stage = newStage;
      deal.movedAt = new Date().toISOString();
      PipelinePage.saveDeals(deals);
      UI.toast('Moved to ' + PipelinePage.stages.find(function(s) { return s.id === newStage; }).label);
      UI.closeModal();
      loadPage('pipeline');
    }
  },

  updateValue: function(dealId) {
    var val = parseFloat(document.getElementById('deal-value').value) || 0;
    var deals = PipelinePage.getDeals();
    var deal = deals.find(function(d) { return d.id === dealId; });
    if (deal) {
      deal.value = val;
      PipelinePage.saveDeals(deals);
      UI.toast('Value updated to ' + UI.moneyInt(val));
    }
  },

  removeDeal: function(dealId) {
    UI.confirm('Delete this deal from the pipeline?', function() {
      var deals = PipelinePage.getDeals().filter(function(d) { return d.id !== dealId; });
      PipelinePage.saveDeals(deals);
      UI.toast('Deal removed');
      UI.closeModal();
      loadPage('pipeline');
    });
  }
};
