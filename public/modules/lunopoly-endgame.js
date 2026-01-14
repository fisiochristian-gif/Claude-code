// ================================
// LUNOPOLY END-GAME MODULE
// Bankruptcy, Rankings, Prize Distribution
// ================================

let debtWarningActive = false;
let debtTimer = null;

// ================================
// BANKRUPTCY & DEBT MANAGEMENT
// ================================

// Show debt warning overlay
function showDebtWarning(debtAmount, timeLimit) {
    if (debtWarningActive) return;

    debtWarningActive = true;
    const timeInSeconds = Math.floor(timeLimit / 1000);

    const overlay = document.createElement('div');
    overlay.id = 'debtWarning';
    overlay.className = 'debt-warning-overlay';
    overlay.innerHTML = `
        <div class="debt-warning-card">
            <div class="warning-icon">⚠️</div>
            <div class="warning-title">DEBITO RILEVATO!</div>
            <div class="debt-amount">Devi: ${debtAmount} L</div>
            <div class="warning-text">
                Hai <span class="debt-countdown">${timeInSeconds}s</span> per saldare il debito!
            </div>
            <div class="warning-actions">
                <p>Puoi solo:</p>
                <ul>
                    <li>💰 Ipotecare proprietà (50% valore)</li>
                    <li>🏠 Vendere edifici</li>
                </ul>
            </div>
            <div class="warning-timer-bar">
                <div class="timer-fill" id="debtTimerFill"></div>
            </div>
            <button class="bankruptcy-btn" onclick="declareBankruptcy()">
                💥 Dichiara Bancarotta
            </button>
        </div>
    `;

    document.body.appendChild(overlay);

    // Start countdown
    let secondsLeft = timeInSeconds;
    const countdownEl = overlay.querySelector('.debt-countdown');
    const timerFill = document.getElementById('debtTimerFill');

    debtTimer = setInterval(() => {
        secondsLeft--;
        countdownEl.textContent = `${secondsLeft}s`;

        // Update timer bar
        const percentage = (secondsLeft / timeInSeconds) * 100;
        timerFill.style.width = `${percentage}%`;

        if (secondsLeft <= 10) {
            countdownEl.style.color = '#ff0000';
            timerFill.style.background = '#ff0000';
        }

        if (secondsLeft <= 0) {
            clearInterval(debtTimer);
            hideDebtWarning();
        }
    }, 1000);
}

// Hide debt warning
function hideDebtWarning() {
    if (debtTimer) {
        clearInterval(debtTimer);
        debtTimer = null;
    }

    const overlay = document.getElementById('debtWarning');
    if (overlay) {
        overlay.remove();
    }

    debtWarningActive = false;
}

// Declare bankruptcy manually
async function declareBankruptcy() {
    if (!window.app.currentUser) return;

    if (!confirm('Sei sicuro di voler dichiarare BANCAROTTA? Perderai tutte le proprietà e uscirai dal gioco!')) {
        return;
    }

    try {
        const response = await fetch(`${window.app.API_BASE}/api/game/bankruptcy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerId: window.app.currentUser.id_univoco,
                tableId: 1
            })
        });

        const result = await response.json();

        if (result.success) {
            hideDebtWarning();
            alert('💥 Sei in BANCAROTTA! Le tue proprietà sono state liquidate.');
        }

    } catch (error) {
        console.error('Bankruptcy error:', error);
        alert('Errore durante la dichiarazione di bancarotta');
    }
}

// ================================
// END-GAME RESULTS SCREEN
// ================================

// Show final results (Risultati Finali)
function showGameResults(data) {
    const { rankings, totalBurned, botsOnly, prizeDistribution } = data;

    const overlay = document.createElement('div');
    overlay.className = 'game-results-overlay';

    // Generate ranking HTML
    const rankingHTML = rankings.map((player, index) => {
        const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index] || '';
        const prize = player.creditsWon || 0;
        const burned = player.burned ? '🔥 BRUCIATI' : '';

        return `
            <div class="rank-card rank-${index + 1}">
                <div class="rank-medal">${medal}</div>
                <div class="rank-info">
                    <div class="rank-name">${player.username}${player.isBot ? ' 🤖' : ''}</div>
                    <div class="rank-wealth">💰 ${player.totalWealth} L Totali</div>
                    <div class="rank-breakdown">
                        Cash: ${player.cashBalance} L | Proprietà: ${player.propertyValue} L | Edifici: ${player.buildingValue} L
                    </div>
                    <div class="rank-points">🏆 ${player.matchPoints} Punti Match</div>
                </div>
                <div class="rank-prize">
                    ${prize > 0 ? `<div class="prize-amount">${prize} Crediti</div>` : ''}
                    ${burned ? `<div class="prize-burned">${burned}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    overlay.innerHTML = `
        <div class="game-results-container">
            <div class="results-header">
                <div class="results-title">🏁 RISULTATI FINALI</div>
                ${botsOnly ? '<div class="results-subtitle">⚠️ Partita chiusa - Solo Bot rimanenti</div>' : ''}
            </div>

            <div class="results-rankings">
                ${rankingHTML}
            </div>

            ${totalBurned > 0 ? `
                <div class="credits-burned-alert">
                    🔥 <strong>${totalBurned} CREDITI BRUCIATI</strong> 🔥
                    <p>${botsOnly ? 'Partita chiusa prematuramente - Tutti i crediti sono stati rimossi dall\'ecosistema' : 'I crediti vinti dai Bot sono stati bruciati permanentemente'}</p>
                </div>
            ` : ''}

            <div class="results-actions">
                <button class="lobby-btn" onclick="returnToLobby()">
                    🏠 Torna alla Lobby
                </button>
                <button class="leaderboard-btn" onclick="showMonthlyLeaderboard()">
                    🏆 Classifica Mensile
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

// Return to lobby
function returnToLobby() {
    // Remove results overlay
    const overlay = document.querySelector('.game-results-overlay');
    if (overlay) overlay.remove();

    // Reload page or navigate to lobby
    window.location.reload();
}

// Show monthly leaderboard
async function showMonthlyLeaderboard() {
    try {
        const response = await fetch(`${window.app.API_BASE}/api/leaderboard/monthly?limit=10`);
        const leaderboard = await response.json();

        const leaderboardHTML = leaderboard.map((player, index) => {
            return `
                <div class="leaderboard-row">
                    <span class="lb-rank">#${index + 1}</span>
                    <span class="lb-name">${player.username}</span>
                    <span class="lb-points">${player.total_match_points} pts</span>
                    <span class="lb-games">${player.games_played} partite</span>
                    <span class="lb-medals">
                        🥇${player.first_place} 🥈${player.second_place} 🥉${player.third_place}
                    </span>
                </div>
            `;
        }).join('');

        const overlay = document.createElement('div');
        overlay.className = 'leaderboard-overlay';
        overlay.innerHTML = `
            <div class="leaderboard-container">
                <div class="leaderboard-header">
                    <h2>🏆 Classifica Mensile</h2>
                    <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">✖</button>
                </div>
                <div class="leaderboard-list">
                    ${leaderboardHTML}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

    } catch (error) {
        console.error('Leaderboard error:', error);
        alert('Errore caricamento classifica');
    }
}

// ================================
// SOCKET EVENT HANDLERS
// ================================

// Listen for debt warnings
if (window.app && window.app.socket) {
    window.app.socket.on('debt:warning', (data) => {
        if (data.playerId === window.app.currentUser?.id_univoco) {
            showDebtWarning(data.debtAmount, data.timeLimit);
        }
    });

    // Listen for bankruptcy events
    window.app.socket.on('player:bankrupt', (data) => {
        console.log('Player bankrupt:', data);

        if (data.playerId === window.app.currentUser?.id_univoco) {
            hideDebtWarning();
            alert(data.automatic ?
                '💥 BANCAROTTA AUTOMATICA! Non hai saldato il debito in tempo.' :
                '💥 Sei in BANCAROTTA!'
            );
        }
    });

    // Listen for game end
    window.app.socket.on('game:ended', (data) => {
        console.log('Game ended:', data);
        showGameResults(data);
    });
}

// ================================
// EXPORTS
// ================================

window.showDebtWarning = showDebtWarning;
window.hideDebtWarning = hideDebtWarning;
window.declareBankruptcy = declareBankruptcy;
window.showGameResults = showGameResults;
window.returnToLobby = returnToLobby;
window.showMonthlyLeaderboard = showMonthlyLeaderboard;
