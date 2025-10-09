import { supabase } from '@/integrations/supabase/client';

export interface UserPreferences {
  id?: string;
  user_id: string;
  preferred_stores: { [store: string]: number };
  preferred_brands: { [category: string]: string };
  substitution_tolerance: 'strict' | 'moderate' | 'flexible';
  max_price_variance: number;
  budget_priority: boolean;
  updated_at?: string;
}

export interface ShoppingHistoryInsight {
  totalSessions: number;
  averageCost: number;
  totalSavings: number;
  mostUsedStores: Array<{ store: string; count: number }>;
}

export interface AgentDecision {
  id: string;
  shopping_session_id: string;
  decision_type: string;
  original_plan?: any;
  final_decision: any;
  reasoning: string;
  confidence_score: number;
  created_at: string;
}

export class AutonomousShoppingService {
  /**
   * Get user's autonomous shopping preferences
   */
  static async getPreferences(userId: string): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching preferences:', error);
    }

    if (!data) {
      return this.getDefaultPreferences(userId);
    }

    // Type cast the JSON fields
    return {
      ...data,
      preferred_stores: (data.preferred_stores as any) || {},
      preferred_brands: (data.preferred_brands as any) || {},
    } as UserPreferences;
  }

  /**
   * Get default preferences for new users
   */
  static getDefaultPreferences(userId: string): UserPreferences {
    return {
      user_id: userId,
      preferred_stores: {},
      preferred_brands: {},
      substitution_tolerance: 'moderate',
      max_price_variance: 0.15,
      budget_priority: true,
    };
  }

  /**
   * Get shopping history insights for the user
   */
  static async getHistoryInsights(userId: string): Promise<ShoppingHistoryInsight> {
    const { data, error } = await supabase
      .from('shopping_history')
      .select('*')
      .eq('user_id', userId)
      .order('session_date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching history:', error);
      return {
        totalSessions: 0,
        averageCost: 0,
        totalSavings: 0,
        mostUsedStores: [],
      };
    }

    const totalSessions = data?.length || 0;
    const averageCost = totalSessions > 0
      ? data.reduce((sum, session) => sum + (session.total_cost || 0), 0) / totalSessions
      : 0;
    const totalSavings = data?.reduce((sum, session) => sum + (session.total_savings || 0), 0) || 0;

    // Count store usage
    const storeCount: { [store: string]: number } = {};
    data?.forEach(session => {
      session.stores_used?.forEach((store: string) => {
        storeCount[store] = (storeCount[store] || 0) + 1;
      });
    });

    const mostUsedStores = Object.entries(storeCount)
      .map(([store, count]) => ({ store, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalSessions,
      averageCost,
      totalSavings,
      mostUsedStores,
    };
  }

  /**
   * Get audit trail of decisions for a shopping session
   */
  static async getDecisionHistory(sessionId: string): Promise<AgentDecision[]> {
    const { data, error } = await supabase
      .from('agent_decisions')
      .select('*')
      .eq('shopping_session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching decision history:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get the most recent shopping session for a user
   */
  static async getLastSession(userId: string) {
    const { data, error } = await supabase
      .from('shopping_history')
      .select('*')
      .eq('user_id', userId)
      .order('session_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching last session:', error);
      return null;
    }

    return data;
  }

  /**
   * Update user preferences manually
   */
  static async updatePreferences(preferences: UserPreferences): Promise<boolean> {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        ...preferences,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating preferences:', error);
      return false;
    }

    return true;
  }

  /**
   * Get all shopping history for a user
   */
  static async getAllHistory(userId: string) {
    const { data, error } = await supabase
      .from('shopping_history')
      .select('*')
      .eq('user_id', userId)
      .order('session_date', { ascending: false });

    if (error) {
      console.error('Error fetching all history:', error);
      return [];
    }

    return data || [];
  }
}
