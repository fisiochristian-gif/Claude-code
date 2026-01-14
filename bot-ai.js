// ================================
// STRATEGIC BOT AI
// Advanced decision-making for LUNOPOLY bots
// ================================

const db = require('./database');

class BotAI {
  constructor() {
    this.LIQUIDITY_RESERVE = 150; // Minimum L to keep for rents
    this.SET_COMPLETION_MULTIPLIER = 0.8; // Bid up to 80% for set-completing properties
    this.NORMAL_BID_MULTIPLIER = 0.4; // Bid up to 40% for normal properties
  }

  // ================================
  // PROPERTY PURCHASE DECISIONS
  // ================================

  async shouldBuyProperty(botId, tableId, property) {
    try {
      const botState = await db.getPlayerState(botId);
      const availableCash = botState.game_balance;

      // Check liquidity reserve
      if (availableCash - property.price < this.LIQUIDITY_RESERVE) {
        return {
          shouldBuy: false,
          reason: 'insufficient_liquidity',
          recommendation: 'Keep 150L reserve for rents'
        };
      }

      // Analyze color sets
      const colorAnalysis = await db.analyzeBotColorSets(botId, tableId);

      // Priority 1: Does this complete a set?
      const wouldCompleteSet = colorAnalysis.partialSets.some(partial => {
        return partial.color === property.color_group &&
               partial.missingCount === 1;
      });

      if (wouldCompleteSet) {
        return {
          shouldBuy: true,
          priority: 'HIGH',
          reason: 'completes_color_set',
          recommendation: `Buy! Completes ${property.color_group} set`
        };
      }

      // Priority 2: Does this start a new set we can potentially complete?
      const isStrategicColor = this.isStrategicColorGroup(property.color_group);

      if (isStrategicColor && availableCash > property.price * 2) {
        return {
          shouldBuy: true,
          priority: 'MEDIUM',
          reason: 'strategic_set_building',
          recommendation: `Buy to start ${property.color_group} set`
        };
      }

      // Priority 3: Cheap property for monopoly blocking
      if (property.price < 100 && availableCash > property.price * 3) {
        return {
          shouldBuy: true,
          priority: 'LOW',
          reason: 'blocking_strategy',
          recommendation: 'Buy cheap property to block opponents'
        };
      }

      return {
        shouldBuy: false,
        reason: 'not_strategic',
        recommendation: 'Pass - not strategically important'
      };

    } catch (error) {
      console.error('Error in bot buy decision:', error);
      return { shouldBuy: false, reason: 'error' };
    }
  }

  // ================================
  // AUCTION BIDDING STRATEGY
  // ================================

  async calculateAuctionBid(botId, tableId, property, currentBid, currentHighBidder) {
    try {
      const botState = await db.getPlayerState(botId);
      const availableCash = botState.game_balance;

      // Don't bid if we're already the high bidder
      if (currentHighBidder === botId) {
        return {
          shouldBid: false,
          bidAmount: 0,
          reason: 'already_high_bidder'
        };
      }

      // Use strategic bid calculation from database
      const bidDecision = await db.calculateBotStrategicBid(
        botId,
        tableId,
        property.id,
        currentBid
      );

      return bidDecision;

    } catch (error) {
      console.error('Error calculating bot auction bid:', error);
      return { shouldBid: false, bidAmount: 0, reason: 'error' };
    }
  }

  // ================================
  // BUILDING/UPGRADE DECISIONS
  // ================================

  async shouldUpgradeProperty(botId, tableId, propertyId) {
    try {
      const botState = await db.getPlayerState(botId);
      const availableCash = botState.game_balance;
      const property = await db.getProperty(propertyId);

      // Must own the property
      if (property.owner_id !== botId) {
        return { shouldUpgrade: false, reason: 'not_owned' };
      }

      // Check if part of completed set
      const colorAnalysis = await db.analyzeBotColorSets(botId, tableId);
      const isInCompletedSet = colorAnalysis.completedSets.some(set =>
        set.properties.some(p => p.id === propertyId)
      );

      if (!isInCompletedSet) {
        return {
          shouldUpgrade: false,
          reason: 'set_not_complete',
          recommendation: 'Complete the color set first'
        };
      }

      // Check liquidity
      const upgradeCost = property.house_price;

      if (availableCash - upgradeCost < this.LIQUIDITY_RESERVE) {
        return {
          shouldUpgrade: false,
          reason: 'insufficient_liquidity',
          recommendation: `Need ${this.LIQUIDITY_RESERVE}L reserve`
        };
      }

      // Upgrade strategy: Focus on one set at a time
      const currentLevel = property.level;

      if (currentLevel < 3) {
        // Build up to level 3 (houses) aggressively
        return {
          shouldUpgrade: true,
          priority: 'HIGH',
          reason: 'building_rental_income',
          recommendation: `Upgrade to level ${currentLevel + 1}`
        };
      } else if (currentLevel === 3 && availableCash > upgradeCost * 2) {
        // Build level 4 (hotel) if we have comfortable cash
        return {
          shouldUpgrade: true,
          priority: 'MEDIUM',
          reason: 'hotel_upgrade',
          recommendation: 'Upgrade to hotel'
        };
      }

      return {
        shouldUpgrade: false,
        reason: 'sufficient_level',
        recommendation: 'Property sufficiently upgraded'
      };

    } catch (error) {
      console.error('Error in upgrade decision:', error);
      return { shouldUpgrade: false, reason: 'error' };
    }
  }

  // ================================
  // MORTGAGE DECISIONS (SMART)
  // ================================

  async decideMortgageStrategy(botId, tableId, debtAmount) {
    try {
      // Use smart mortgaging from database
      const mortgagePlan = await db.determineBotMortgagePriority(botId, tableId, debtAmount);

      if (!mortgagePlan.canCoverDebt) {
        return {
          canPayDebt: false,
          strategy: 'bankruptcy',
          recommendation: 'Insufficient assets to cover debt',
          propertiesToMortgage: []
        };
      }

      return {
        canPayDebt: true,
        strategy: 'smart_mortgage',
        recommendation: `Mortgage ${mortgagePlan.propertiesToMortgage.length} properties (singles first)`,
        propertiesToMortgage: mortgagePlan.propertiesToMortgage,
        totalMortgageValue: mortgagePlan.totalMortgageValue
      };

    } catch (error) {
      console.error('Error in mortgage decision:', error);
      return { canPayDebt: false, strategy: 'error', propertiesToMortgage: [] };
    }
  }

  // ================================
  // TRADE DECISIONS
  // ================================

  async evaluateTradeOffer(botId, tableId, tradeOffer) {
    try {
      const { offeredProperties, requestedProperties, offeredCash, requestedCash } = tradeOffer;

      // Analyze what we gain vs what we lose
      const colorAnalysis = await db.analyzeBotColorSets(botId, tableId);

      // Check if requested properties would complete a set
      let wouldCompleteSet = false;
      let wouldBreakSet = false;

      for (const propId of requestedProperties) {
        const prop = await db.getProperty(propId);

        // Would this complete a set for us?
        const partial = colorAnalysis.partialSets.find(p => p.color === prop.color_group);
        if (partial && partial.missingCount === 1) {
          wouldCompleteSet = true;
        }
      }

      for (const propId of offeredProperties) {
        const prop = await db.getProperty(propId);

        // Would we break a completed set?
        const complete = colorAnalysis.completedSets.find(c => c.color === prop.color_group);
        if (complete) {
          wouldBreakSet = true;
        }
      }

      // Decision logic
      if (wouldCompleteSet && !wouldBreakSet) {
        return {
          shouldAccept: true,
          priority: 'HIGH',
          reason: 'completes_set',
          recommendation: 'Accept! This completes a color set'
        };
      }

      if (wouldBreakSet) {
        return {
          shouldAccept: false,
          reason: 'breaks_complete_set',
          recommendation: 'Reject! Would break completed set'
        };
      }

      // Evaluate cash balance
      const netCash = offeredCash - requestedCash;
      const botState = await db.getPlayerState(botId);

      if (netCash < 0 && botState.game_balance + netCash < this.LIQUIDITY_RESERVE) {
        return {
          shouldAccept: false,
          reason: 'cash_shortage',
          recommendation: `Reject! Would drop below ${this.LIQUIDITY_RESERVE}L reserve`
        };
      }

      // Default: Neutral trade, accept if fair value
      if (netCash >= 0 || Math.abs(netCash) < 50) {
        return {
          shouldAccept: true,
          priority: 'MEDIUM',
          reason: 'fair_value',
          recommendation: 'Accept - fair trade'
        };
      }

      return {
        shouldAccept: false,
        reason: 'unfavorable',
        recommendation: 'Reject - unfavorable terms'
      };

    } catch (error) {
      console.error('Error evaluating trade:', error);
      return { shouldAccept: false, reason: 'error' };
    }
  }

  // ================================
  // HELPER FUNCTIONS
  // ================================

  isStrategicColorGroup(colorGroup) {
    // Orange, Red, and Yellow are high-traffic areas (post-jail)
    const strategicColors = ['orange', 'red', 'yellow', 'green'];
    return strategicColors.includes(colorGroup);
  }

  async updateBotStrategyState(botId, tableId) {
    try {
      // Analyze current position
      const colorAnalysis = await db.analyzeBotColorSets(botId, tableId);

      // Extract target colors (partial sets we want to complete)
      const targetColorSets = colorAnalysis.partialSets.map(p => p.color);

      // Extract partial sets owned
      const partialSetsOwned = colorAnalysis.partialSets.map(p => ({
        color: p.color,
        ownedCount: p.ownedCount,
        requiredCount: p.requiredCount,
        properties: p.properties.map(prop => prop.id)
      }));

      // Update strategy in database
      await db.updateBotStrategy(botId, tableId, {
        targetColorSets,
        partialSetsOwned,
        liquidityReserve: this.LIQUIDITY_RESERVE
      });

      console.log(`🤖 Bot ${botId} strategy updated: ${targetColorSets.length} target sets`);

    } catch (error) {
      console.error('Error updating bot strategy:', error);
    }
  }
}

module.exports = new BotAI();
