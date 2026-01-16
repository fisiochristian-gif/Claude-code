// ================================
// SERVER-SIDE TIMER MANAGER
// Centralized timer system that runs independent of client connections
// ================================

const db = require('./database');

class TimerManager {
  constructor(io) {
    this.io = io;
    this.activeTimers = new Map(); // Map<timerId, { timeout, data }>
    this.timerCallbacks = new Map(); // Map<timerType, callback>

    // Initialize timer recovery on startup
    this.recoverActiveTimers();
  }

  // Register callback for timer type
  registerCallback(timerType, callback) {
    this.timerCallbacks.set(timerType, callback);
    console.log(`📡 Timer callback registered: ${timerType}`);
  }

  // Create a new server-side timer
  async createTimer(tableId, playerId, timerType, actionType, durationMs, autoAction = null, metadata = {}) {
    try {
      // Save timer to database
      const timerRecord = await db.createServerTimer(
        tableId,
        playerId,
        timerType,
        actionType,
        durationMs,
        autoAction
      );

      const timerId = timerRecord.timerId;

      // Create actual setTimeout
      const timeout = setTimeout(async () => {
        await this.executeTimer(timerId, timerType, {
          tableId,
          playerId,
          actionType,
          autoAction,
          ...metadata
        });
      }, durationMs);

      // Store in memory
      this.activeTimers.set(timerId, {
        timeout,
        data: {
          timerId,
          tableId,
          playerId,
          timerType,
          actionType,
          autoAction,
          startedAt: timerRecord.startedAt,
          expiresAt: timerRecord.expiresAt,
          ...metadata
        }
      });

      console.log(`⏰ Timer created: ${timerType} for player ${playerId} (${durationMs}ms)`);

      // Broadcast timer start to all players at table
      this.io.to(`table_${tableId}`).emit('timer:started', {
        timerId,
        playerId,
        timerType,
        actionType,
        durationMs,
        expiresAt: timerRecord.expiresAt
      });

      return timerId;

    } catch (error) {
      console.error('Error creating timer:', error);
      throw error;
    }
  }

  // Cancel a timer
  async cancelTimer(timerId) {
    try {
      const timerData = this.activeTimers.get(timerId);

      if (timerData) {
        // Clear timeout
        clearTimeout(timerData.timeout);

        // Remove from memory
        this.activeTimers.delete(timerId);

        // Mark as completed in database
        await db.completeServerTimer(timerId);

        console.log(`⏰ Timer cancelled: ${timerId}`);

        // Broadcast cancellation
        if (timerData.data.tableId) {
          this.io.to(`table_${timerData.data.tableId}`).emit('timer:cancelled', {
            timerId
          });
        }
      }
    } catch (error) {
      console.error('Error cancelling timer:', error);
    }
  }

  // Execute timer when it expires
  async executeTimer(timerId, timerType, data) {
    try {
      console.log(`⏰ Timer expired: ${timerType} for player ${data.playerId}`);

      // Get callback for this timer type
      const callback = this.timerCallbacks.get(timerType);

      if (callback) {
        // Execute the registered callback
        await callback(data);
      } else {
        console.warn(`⚠️ No callback registered for timer type: ${timerType}`);
      }

      // Complete timer in database
      await db.completeServerTimer(timerId);

      // Remove from active timers
      this.activeTimers.delete(timerId);

      // Broadcast timer completion
      this.io.to(`table_${data.tableId}`).emit('timer:expired', {
        timerId,
        timerType,
        playerId: data.playerId,
        autoAction: data.autoAction
      });

    } catch (error) {
      console.error('Error executing timer:', error);
    }
  }

  // Recover timers on server restart
  async recoverActiveTimers() {
    try {
      // Get all active tables
      const tables = await db.getAllGameTables();

      for (const table of tables) {
        if (table.status === 'playing' || table.status === 'waiting') {
          // Get active timers for this table
          const timers = await db.getActiveTimers(table.table_id);

          for (const timer of timers) {
            const now = new Date();
            const expiresAt = new Date(timer.expires_at);
            const remainingMs = expiresAt.getTime() - now.getTime();

            if (remainingMs > 0) {
              // Timer still has time remaining - recreate it
              console.log(`🔄 Recovering timer ${timer.id}: ${remainingMs}ms remaining`);

              const timeout = setTimeout(async () => {
                await this.executeTimer(timer.id, timer.timer_type, {
                  tableId: timer.table_id,
                  playerId: timer.player_id,
                  actionType: timer.action_type,
                  autoAction: timer.auto_action
                });
              }, remainingMs);

              this.activeTimers.set(timer.id, {
                timeout,
                data: {
                  timerId: timer.id,
                  tableId: timer.table_id,
                  playerId: timer.player_id,
                  timerType: timer.timer_type,
                  actionType: timer.action_type,
                  autoAction: timer.auto_action,
                  startedAt: timer.started_at,
                  expiresAt: timer.expires_at
                }
              });
            } else {
              // Timer already expired - execute immediately
              console.log(`⚡ Executing expired timer ${timer.id} immediately`);
              await this.executeTimer(timer.id, timer.timer_type, {
                tableId: timer.table_id,
                playerId: timer.player_id,
                actionType: timer.action_type,
                autoAction: timer.auto_action
              });
            }
          }
        }
      }

      console.log(`✅ Timer recovery complete: ${this.activeTimers.size} timers active`);

    } catch (error) {
      console.error('Error recovering timers:', error);
    }
  }

  // Get all active timers for a table
  getTableTimers(tableId) {
    const tableTimers = [];
    this.activeTimers.forEach((timer, timerId) => {
      if (timer.data.tableId === tableId) {
        tableTimers.push({
          timerId,
          ...timer.data
        });
      }
    });
    return tableTimers;
  }

  // Get all active timers for a player
  getPlayerTimers(playerId) {
    const playerTimers = [];
    this.activeTimers.forEach((timer, timerId) => {
      if (timer.data.playerId === playerId) {
        playerTimers.push({
          timerId,
          ...timer.data
        });
      }
    });
    return playerTimers;
  }

  // Clear all timers for a table (when game ends)
  async clearTableTimers(tableId) {
    const timersToCancel = [];

    this.activeTimers.forEach((timer, timerId) => {
      if (timer.data.tableId === tableId) {
        timersToCancel.push(timerId);
      }
    });

    for (const timerId of timersToCancel) {
      await this.cancelTimer(timerId);
    }

    console.log(`🧹 Cleared ${timersToCancel.length} timers for table ${tableId}`);
  }
}

module.exports = TimerManager;
